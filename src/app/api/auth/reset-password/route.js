import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * POST /api/auth/reset-password
 * Reset password after OTP verification.
 * Requires userId, newPassword, and the single-use resetToken issued by
 * POST /api/auth/verify-otp (type: "password-reset") for this exact
 * verification event — the token, not just knowledge of userId, proves the
 * caller actually completed the OTP step.
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { userId, newPassword, resetToken } = body;

    // Validate required fields
    if (!userId || !newPassword || !resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide userId, newPassword, and resetToken",
        },
        { status: 400 },
      );
    }

    // Validate password length
    if (newPassword.length < 8 || newPassword.length > 32) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 32 characters long",
        },
        { status: 400 },
      );
    }

    // Find user by userId
    const user = await User.findOne({
      _id: userId,
      isdeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Check if user is blocked
    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 },
      );
    }

    // Verify the resetToken: must be a valid JWT for this user, must match
    // the token this exact server issued (stored on the user doc when the
    // OTP was verified), and must not have expired or already been used.
    let decoded;
    try {
      decoded = jwt.verify(resetToken, getJwtSecret());
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token. Please verify OTP again.",
        },
        { status: 400 },
      );
    }

    if (
      decoded.type !== "password-reset" ||
      String(decoded.userId) !== String(user._id) ||
      !user.resetPasswordToken ||
      user.resetPasswordToken !== resetToken ||
      !user.resetPasswordExpires ||
      new Date(user.resetPasswordExpires) < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token. Please verify OTP again.",
        },
        { status: 400 },
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Clear password reset tokens if they exist
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Save user (password will be hashed automatically)
    await user.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
        data: {
          userId: user._id,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);

    // Handle invalid ObjectId format
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID format",
        },
        { status: 400 },
      );
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 },
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Password reset failed. Please try again.",
      },
      { status: 500 },
    );
  }
}

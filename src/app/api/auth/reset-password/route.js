import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import OTP from "@/models/otp.model";

/**
 * POST /api/auth/reset-password
 * Reset password after OTP verification
 * Requires userId and newPassword (OTP should be verified via verify-forgot-pass-otp first)
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { userId, newPassword } = body;

    // Validate required fields
    if (!userId || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide both userId and newPassword",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8 || newPassword.length > 32) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 32 characters long",
        },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Verify that a password-reset OTP was recently verified (within last 10 minutes)
    const recentOTP = await OTP.findOne({
      userId: user._id,
      type: "password-reset",
      isUsed: true,
      updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Within last 10 minutes
    }).sort({ updatedAt: -1 });

    if (!recentOTP) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please verify OTP first using /api/auth/verify-forgot-pass-otp",
        },
        { status: 400 }
      );
    }

    // Check if user is blocked
    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 }
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
      { status: 200 }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Password reset failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

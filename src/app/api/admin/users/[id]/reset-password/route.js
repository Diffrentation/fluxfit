import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendAdminPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (Admin)
 *
 * Body Parameters:
 * - newPassword: New password (required, min 8 characters)
 * - confirmPassword: Confirm new password (required, must match newPassword)
 */
export async function POST(request, { params }) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get user ID
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
          errors: [{ field: "id", message: "Valid user ID is required" }],
        },
        { status: 400 },
      );
    }

    // Get body
    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password and confirm password are required",
          errors: [
            { field: "newPassword", message: "New password is required" },
            {
              field: "confirmPassword",
              message: "Confirm password is required",
            },
          ],
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
          errors: [
            {
              field: "newPassword",
              message: "Password must be at least 8 characters long",
            },
          ],
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match",
          errors: [
            {
              field: "confirmPassword",
              message: "Passwords do not match",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Get user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    user.token = null; // Invalidate existing tokens
    await user.save();

    // Notify the user of their new password by email (best-effort)
    if (user.email) {
      sendAdminPasswordResetEmail(user.email, {
        newPassword,
        firstname: user.firstname,
      }).catch((err) =>
        console.error("Failed to send admin password reset email:", err)
      );
    }

    // Format user (without password)
    const formattedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      passwordResetAt: new Date(),
      passwordResetBy: adminUser._id,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User password reset successfully",
        data: {
          user: formattedUser,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset user password error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to reset user password. Please try again.",
      },
      { status: 500 },
    );
  }
}

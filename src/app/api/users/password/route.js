import { NextResponse } from "next/server";
import { authenticateUserWithPassword } from "@/lib/auth";

/**
 * PUT /api/users/password
 * Change user password
 */
export async function PUT(request) {
  try {
    // Authenticate user (with password field)
    const { error, user } = await authenticateUserWithPassword(request);
    if (error) {
      return error;
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required",
          errors: [
            {
              field: !currentPassword ? "currentPassword" : "newPassword",
              message: !currentPassword
                ? "Current password is required"
                : "New password is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate new password length (matching user model validation)
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters long",
          errors: [
            {
              field: "newPassword",
              message: "Password must be at least 8 characters long",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (newPassword.length > 32) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at most 32 characters long",
          errors: [
            {
              field: "newPassword",
              message: "Password must be at most 32 characters long",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from current password",
          errors: [
            {
              field: "newPassword",
              message: "New password must be different from current password",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
          errors: [
            {
              field: "currentPassword",
              message: "Current password is incorrect",
            },
          ],
        },
        { status: 401 }
      );
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
        data: {
          message: "Your password has been updated successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to change password. Please try again.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 * 
 * Body Parameters:
 * - role: New role - "buyer", "admin" (required)
 */
export async function PUT(request, { params }) {
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
        { status: 400 }
      );
    }

    // Prevent changing own role
    if (id === adminUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot change your own role",
        },
        { status: 400 }
      );
    }

    // Get body
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: "Role is required",
          errors: [{ field: "role", message: "Role is required" }],
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["buyer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          errors: [
            {
              field: "role",
              message: `Role must be one of: ${validRoles.join(", ")}`,
            },
          ],
        },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Check if role is already set
    if (user.role === role) {
      return NextResponse.json(
        {
          success: false,
          message: `User already has role "${role}"`,
        },
        { status: 400 }
      );
    }

    // Update role
    const previousRole = user.role;
    user.role = role;
    await user.save();

    // Format user
    const formattedUser = {
      id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      previousRole: previousRole,
      role: user.role,
      updatedAt: user.updatedAt,
      updatedBy: adminUser._id,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User role updated successfully",
        user: formattedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update user role. Please try again.",
      },
      { status: 500 }
    );
  }
}


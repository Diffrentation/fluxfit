import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/users/:id/unblock
 * Unblock user
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

    // Check if already unblocked
    if (!user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "User is not blocked",
        },
        { status: 400 }
      );
    }

    // Unblock user
    user.isblocked = false;
    await user.save();

    // Format user
    const formattedUser = {
      id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      isblocked: user.isblocked,
      unblockedAt: new Date(),
      unblockedBy: adminUser._id,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User unblocked successfully",
        data: {
          user: formattedUser,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to unblock user. Please try again.",
      },
      { status: 500 }
    );
  }
}


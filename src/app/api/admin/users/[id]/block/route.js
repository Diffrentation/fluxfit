import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/users/:id/block
 * Block user
 * 
 * Body Parameters:
 * - reason: Reason for blocking (optional)
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

    // Prevent blocking self
    if (id === adminUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot block yourself",
        },
        { status: 400 }
      );
    }

    // Get body
    const body = await request.json();
    const { reason } = body;

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

    // Check if already blocked
    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "User is already blocked",
        },
        { status: 400 }
      );
    }

    // Block user
    user.isblocked = true;
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
      blockedAt: new Date(),
      blockedBy: adminUser._id,
      blockReason: reason || null,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User blocked successfully",
        data: {
          user: formattedUser,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to block user. Please try again.",
      },
      { status: 500 }
    );
  }
}


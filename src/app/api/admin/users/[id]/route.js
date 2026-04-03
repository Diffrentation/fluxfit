import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/users/:id
 * Get user details
 */
export async function GET(request, { params }) {
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
    const user = await User.findById(id).select("-password -token").lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Format user
    const formattedUser = {
      id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone || null,
      role: user.role || "buyer",
      profileimage: user.profileimage || null,
      isverified: user.isverified || false,
      isblocked: user.isblocked || false,
      isdeleted: user.isdeleted || false,
      address: user.address || null,
      adminPermissions: user.adminPermissions || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User details retrieved successfully",
        user: formattedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user details error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve user details. Please try again.",
      },
      { status: 500 }
    );
  }
}


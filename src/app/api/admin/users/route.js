import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/users
 * Get all users (with filters, pagination)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search by name, email, username (optional)
 * - role: Filter by role - "buyer", "admin" (optional)
 * - isBlocked: Filter by blocked status - "true", "false" (optional)
 * - isVerified: Filter by verified status - "true", "false" (optional)
 * - sort: Sort order - "newest" (default), "oldest", "name-asc", "name-desc", "email-asc", "email-desc"
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const isBlocked = searchParams.get("isBlocked");
    const isVerified = searchParams.get("isVerified");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = { isdeleted: false };

    if (role) {
      query.role = role;
    }

    if (isBlocked === "true") {
      query.isblocked = true;
    } else if (isBlocked === "false") {
      query.isblocked = false;
    }

    if (isVerified === "true") {
      query.isverified = true;
    } else if (isVerified === "false") {
      query.isverified = false;
    }

    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "name-asc":
        sortObj.firstname = 1;
        sortObj.lastname = 1;
        break;
      case "name-desc":
        sortObj.firstname = -1;
        sortObj.lastname = -1;
        break;
      case "email-asc":
        sortObj.email = 1;
        break;
      case "email-desc":
        sortObj.email = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get users and total count
    const [users, total] = await Promise.all([
      User.find(query).select("-password -token").sort(sortObj).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // One extra aggregation over just this page's user IDs (not N+1 per
    // user) to get real order counts/spend instead of hardcoding 0 in the UI.
    const orderStats = users.length
      ? await Order.aggregate([
          { $match: { user: { $in: users.map((u) => u._id) } } },
          {
            $group: {
              _id: "$user",
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: "$total" },
            },
          },
        ])
      : [];
    const statsByUser = new Map(
      orderStats.map((s) => [s._id.toString(), s])
    );

    // Format users
    const formattedUsers = users.map((user) => {
      const stats = statsByUser.get(user._id.toString());
      return {
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
        address: user.address || null,
        totalOrders: stats?.totalOrders || 0,
        totalSpent: Math.round((stats?.totalSpent || 0) * 100) / 100,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Users retrieved successfully",
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          search: search || null,
          role: role || null,
          isBlocked: isBlocked || null,
          isVerified: isVerified || null,
          sort,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve users. Please try again.",
      },
      { status: 500 }
    );
  }
}


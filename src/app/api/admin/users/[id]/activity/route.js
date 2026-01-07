import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/users/:id/activity
 * Get user activity log
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - type: Filter by activity type - "orders", "all" (default: "all")
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
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
    const { id } = params;
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

    // Verify user exists
    const user = await User.findById(id).select("firstname lastname email createdAt");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get activities based on type
    let activities = [];
    let total = 0;

    if (type === "orders" || type === "all") {
      const orderQuery = { user: id, ...dateFilter };
      const [orders, orderCount] = await Promise.all([
        Order.find(orderQuery)
          .sort({ createdAt: -1 })
          .limit(type === "all" ? limit : limit)
          .lean(),
        Order.countDocuments(orderQuery),
      ]);

      orders.forEach((order) => {
        activities.push({
          type: "order",
          action: "order_placed",
          description: `Placed order #${order.orderNumber}`,
          orderNumber: order.orderNumber,
          amount: Math.round(order.total * 100) / 100,
          status: order.status,
          timestamp: order.createdAt,
          metadata: {
            orderId: order._id,
            itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
            paymentMethod: order.payment.method,
            paymentStatus: order.payment.status,
          },
        });
      });

      if (type === "orders") {
        total = orderCount;
      } else {
        total += orderCount;
      }
    }

    // Add user registration activity
    if (type === "all") {
      activities.push({
        type: "account",
        action: "account_created",
        description: "Account created",
        timestamp: user.createdAt,
        metadata: {
          registrationDate: user.createdAt,
        },
      });
      total += 1;
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate activities
    const skip = (page - 1) * limit;
    const paginatedActivities = activities.slice(skip, skip + limit);

    // Calculate activity statistics
    const orderCount = await Order.countDocuments({ user: id });
    const totalSpentResult = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalSpent = totalSpentResult[0]?.total || 0;

    const stats = {
      totalActivities: total,
      orderCount: orderCount,
      totalSpent: Math.round(totalSpent * 100) / 100,
      lastActivity: activities.length > 0 ? activities[0].timestamp : user.createdAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User activity retrieved successfully",
        data: {
          user: {
            id: user._id,
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
          },
          statistics: stats,
          activities: paginatedActivities,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            type: type || "all",
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user activity error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve user activity. Please try again.",
      },
      { status: 500 }
    );
  }
}


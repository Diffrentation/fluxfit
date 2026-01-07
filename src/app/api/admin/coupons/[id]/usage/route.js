import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/coupons/:id/usage
 * Get coupon usage statistics (Admin)
 * Supports both ObjectId and coupon code
 * 
 * Query Parameters:
 * - startDate: Filter orders from this date (ISO format, optional)
 * - endDate: Filter orders until this date (ISO format, optional)
 * - page: Page number for orders list (default: 1)
 * - limit: Items per page for orders list (default: 20, max: 100)
 */
export async function GET(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get coupon ID or code from params
    const { id } = params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon ID or code is required",
          errors: [
            {
              field: "id",
              message: "Coupon ID or code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);

    // Build query - try as ObjectId first, then as coupon code
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    // Find coupon
    const coupon = await Coupon.findOne(query).lean();

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Build order query for coupon usage
    const orderQuery = {
      "coupon.code": coupon.code,
    };

    // Date range filter
    if (startDate || endDate) {
      orderQuery.createdAt = {};
      if (startDate) {
        orderQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        orderQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Get order statistics
    const [
      totalOrders,
      totalRevenue,
      totalDiscount,
      orders,
      ordersByStatus,
      ordersByDate,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(orderQuery),
      // Total revenue (sum of order totals)
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]),
      // Total discount given
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$discount" },
          },
        },
      ]),
      // Recent orders with pagination
      Order.find(orderQuery)
        .populate("user", "firstname lastname email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("orderNumber user total discount status createdAt")
        .lean(),
      // Orders by status
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      // Orders by date (daily breakdown for last 30 days)
      Order.aggregate([
        {
          $match: {
            ...orderQuery,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
            discount: { $sum: "$discount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format statistics
    const totalRevenueAmount = totalRevenue[0]?.total || 0;
    const totalDiscountAmount = totalDiscount[0]?.total || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenueAmount / totalOrders : 0;
    const averageDiscount = totalOrders > 0 ? totalDiscountAmount / totalOrders : 0;

    // Format orders by status
    const statusBreakdown = ordersByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Format recent orders
    const formattedOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      user: order.user
        ? {
            id: order.user._id,
            name: `${order.user.firstname} ${order.user.lastname}`,
            email: order.user.email,
          }
        : null,
      total: order.total,
      discount: order.discount,
      status: order.status,
      createdAt: order.createdAt,
    }));

    // Format daily breakdown
    const dailyBreakdown = ordersByDate.map((item) => ({
      date: item._id,
      orderCount: item.count,
      revenue: item.revenue,
      discount: item.discount,
    }));

    // Calculate usage percentage
    const usagePercentage = coupon.usageLimit
      ? Math.round((coupon.usageCount / coupon.usageLimit) * 100)
      : null;

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon usage statistics retrieved successfully",
        data: {
          coupon: {
            id: coupon._id,
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            discount: coupon.discount,
            usageLimit: coupon.usageLimit || null,
            usageCount: coupon.usageCount || 0,
            usagePercentage: usagePercentage,
            remainingUsage: coupon.usageLimit
              ? Math.max(0, coupon.usageLimit - coupon.usageCount)
              : null,
          },
          statistics: {
            totalOrders: totalOrders,
            totalRevenue: totalRevenueAmount,
            totalDiscount: totalDiscountAmount,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            averageDiscount: Math.round(averageDiscount * 100) / 100,
            statusBreakdown: statusBreakdown,
          },
          dailyBreakdown: dailyBreakdown,
          recentOrders: {
            orders: formattedOrders,
            pagination: {
              page,
              limit,
              total: totalOrders,
              totalPages: Math.ceil(totalOrders / limit),
              hasNextPage: page < Math.ceil(totalOrders / limit),
              hasPrevPage: page > 1,
            },
          },
          filters: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get coupon usage error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve coupon usage. Please try again.",
      },
      { status: 500 }
    );
  }
}


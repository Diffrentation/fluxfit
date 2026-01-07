import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/orders
 * Get order statistics by status
 * 
 * Query Parameters:
 * - period: Time period - "today", "week", "month", "year", "all" (default: "month")
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      switch (period) {
        case "today":
          queryStartDate = new Date(now.setHours(0, 0, 0, 0));
          queryEndDate = new Date();
          break;
        case "week":
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - 7);
          queryEndDate = new Date();
          break;
        case "month":
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          queryEndDate = new Date();
          break;
        case "year":
          queryStartDate = new Date(now.getFullYear(), 0, 1);
          queryEndDate = new Date();
          break;
        case "all":
        default:
          queryStartDate = null;
          queryEndDate = null;
          break;
      }
    }

    // Build query
    const orderQuery = {};
    if (queryStartDate && queryEndDate) {
      orderQuery.createdAt = { $gte: queryStartDate, $lte: queryEndDate };
    }

    // Get order statistics
    const [
      totalOrders,
      ordersByStatus,
      ordersByPaymentStatus,
      ordersByDate,
      averageOrderValue,
      totalRevenue,
    ] = await Promise.all([
      // Total orders
      Order.countDocuments(orderQuery),
      // Orders by status
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Orders by payment status
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: "$payment.status",
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { count: -1 } },
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
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Average order value
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            avg: { $avg: "$total" },
          },
        },
      ]),
      // Total revenue
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]),
    ]);

    // Format orders by status
    const statusBreakdown = ordersByStatus.map((item) => ({
      status: item._id,
      count: item.count,
      revenue: Math.round(item.revenue * 100) / 100,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0,
    }));

    // Format orders by payment status
    const paymentStatusBreakdown = ordersByPaymentStatus.map((item) => ({
      status: item._id,
      count: item.count,
      revenue: Math.round(item.revenue * 100) / 100,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0,
    }));

    // Format daily breakdown
    const dailyBreakdown = ordersByDate.map((item) => ({
      date: item._id,
      count: item.count,
      revenue: Math.round(item.revenue * 100) / 100,
    }));

    // Calculate averages
    const avgOrderValue = averageOrderValue[0]?.avg || 0;
    const totalRevenueAmount = totalRevenue[0]?.total || 0;

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order statistics retrieved successfully",
        data: {
          period: {
            type: period,
            startDate: queryStartDate || null,
            endDate: queryEndDate || null,
          },
          summary: {
            totalOrders: totalOrders,
            totalRevenue: Math.round(totalRevenueAmount * 100) / 100,
            averageOrderValue: Math.round(avgOrderValue * 100) / 100,
          },
          byStatus: statusBreakdown,
          byPaymentStatus: paymentStatusBreakdown,
          dailyBreakdown: dailyBreakdown,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get order statistics error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve order statistics. Please try again.",
      },
      { status: 500 }
    );
  }
}


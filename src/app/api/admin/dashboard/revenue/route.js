import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue data (daily/monthly)
 * 
 * Query Parameters:
 * - period: Time period - "daily" (default), "monthly", "yearly"
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - days: Number of days for daily period (default: 30, max: 365)
 * - months: Number of months for monthly period (default: 12, max: 24)
 * - years: Number of years for yearly period (default: 5, max: 10)
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
    const period = searchParams.get("period") || "daily";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const days = Math.min(parseInt(searchParams.get("days")) || 30, 365);
    const months = Math.min(parseInt(searchParams.get("months")) || 12, 24);
    const years = Math.min(parseInt(searchParams.get("years")) || 5, 10);

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate, groupFormat, dateFormat;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      switch (period) {
        case "daily":
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - days);
          queryEndDate = new Date(now);
          groupFormat = "%Y-%m-%d";
          dateFormat = "YYYY-MM-DD";
          break;
        case "monthly":
          queryStartDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
          queryEndDate = new Date(now);
          groupFormat = "%Y-%m";
          dateFormat = "YYYY-MM";
          break;
        case "yearly":
          queryStartDate = new Date(now.getFullYear() - years, 0, 1);
          queryEndDate = new Date(now);
          groupFormat = "%Y";
          dateFormat = "YYYY";
          break;
        default:
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - 30);
          queryEndDate = new Date(now);
          groupFormat = "%Y-%m-%d";
          dateFormat = "YYYY-MM-DD";
      }
    }

    // Build query
    const orderQuery = {
      createdAt: { $gte: queryStartDate, $lte: queryEndDate },
    };

    // Aggregate revenue data
    const revenueData = await Order.aggregate([
      { $match: orderQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          discount: { $sum: "$discount" },
          orders: { $sum: 1 },
          items: { $sum: { $size: "$items" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format revenue data
    const formattedData = revenueData.map((item) => ({
      date: item._id,
      revenue: Math.round(item.revenue * 100) / 100,
      discount: Math.round(item.discount * 100) / 100,
      net: Math.round((item.revenue - item.discount) * 100) / 100,
      orders: item.orders,
      items: item.items,
      averageOrderValue: Math.round((item.revenue / item.orders) * 100) / 100,
    }));

    // Calculate totals
    const totals = revenueData.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.discount += item.discount;
        acc.orders += item.orders;
        acc.items += item.items;
        return acc;
      },
      { revenue: 0, discount: 0, orders: 0, items: 0 }
    );

    // Calculate averages
    const averageRevenue = formattedData.length > 0 ? totals.revenue / formattedData.length : 0;
    const averageOrders = formattedData.length > 0 ? totals.orders / formattedData.length : 0;

    // Find peak revenue day
    const peakRevenue = formattedData.reduce(
      (max, item) => (item.revenue > max.revenue ? item : max),
      formattedData[0] || { date: null, revenue: 0 }
    );

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Revenue data retrieved successfully",
        data: {
          period: {
            type: period,
            startDate: queryStartDate,
            endDate: queryEndDate,
          },
          revenue: formattedData,
          summary: {
            totalRevenue: Math.round(totals.revenue * 100) / 100,
            totalDiscount: Math.round(totals.discount * 100) / 100,
            netRevenue: Math.round((totals.revenue - totals.discount) * 100) / 100,
            totalOrders: totals.orders,
            totalItems: totals.items,
            averageRevenue: Math.round(averageRevenue * 100) / 100,
            averageOrders: Math.round(averageOrders * 100) / 100,
            peakRevenue: {
              date: peakRevenue.date,
              revenue: Math.round(peakRevenue.revenue * 100) / 100,
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get revenue data error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve revenue data. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import Cart from "@/models/cart.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics (sales, revenue, orders, users)
 * 
 * Query Parameters:
 * - period: Time period - "today", "week", "month", "year", "all" (default: "month")
 * - compare: Compare with previous period (true/false, default: false)
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
    const compare = searchParams.get("compare") === "true";

    // Calculate date ranges
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        if (compare) {
          previousStartDate = new Date(startDate);
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          previousEndDate = new Date(startDate);
        }
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
        if (compare) {
          previousStartDate = new Date(startDate);
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          previousEndDate = new Date(startDate);
        }
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        if (compare) {
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        if (compare) {
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        }
        break;
      case "all":
      default:
        startDate = null;
        endDate = null;
        if (compare) {
          // For "all", compare with last 30 days
          previousStartDate = new Date(now);
          previousStartDate.setDate(previousStartDate.getDate() - 60);
          previousEndDate = new Date(now);
          previousEndDate.setDate(previousEndDate.getDate() - 30);
        }
        break;
    }

    // Build query for current period
    const orderQuery = {};
    if (startDate && endDate) {
      orderQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Get statistics for current period
    const [
      totalOrders,
      totalRevenue,
      totalDiscount,
      ordersByStatus,
      totalUsers,
      newUsers,
      totalProducts,
      activeProducts,
      abandonedCarts,
      averageOrderValue,
    ] = await Promise.all([
      // Total orders
      Order.countDocuments(orderQuery),
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
      // Total users
      User.countDocuments({ isdeleted: false }),
      // New users in period
      startDate && endDate
        ? User.countDocuments({
            isdeleted: false,
            createdAt: { $gte: startDate, $lte: endDate },
          })
        : Promise.resolve(0),
      // Total products
      Product.countDocuments({ isDeleted: false }),
      // Active products
      Product.countDocuments({ isDeleted: false, status: "active", inStock: true }),
      // Abandoned carts (carts with items but no order in last 7 days)
      Cart.countDocuments({
        "items.0": { $exists: true },
        lastUpdated: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
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
    ]);

    // Get previous period statistics if compare is enabled
    let previousStats = null;
    if (compare && previousStartDate && previousEndDate) {
      const previousOrderQuery = {
        createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      };

      const [
        prevTotalOrders,
        prevTotalRevenue,
        prevTotalDiscount,
        prevNewUsers,
        prevAverageOrderValue,
      ] = await Promise.all([
        Order.countDocuments(previousOrderQuery),
        Order.aggregate([
          { $match: previousOrderQuery },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
            },
          },
        ]),
        Order.aggregate([
          { $match: previousOrderQuery },
          {
            $group: {
              _id: null,
              total: { $sum: "$discount" },
            },
          },
        ]),
        User.countDocuments({
          isdeleted: false,
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
        }),
        Order.aggregate([
          { $match: previousOrderQuery },
          {
            $group: {
              _id: null,
              avg: { $avg: "$total" },
            },
          },
        ]),
      ]);

      const prevRevenue = prevTotalRevenue[0]?.total || 0;
      const prevDiscount = prevTotalDiscount[0]?.total || 0;
      const prevAvgOrder = prevAverageOrderValue[0]?.avg || 0;

      previousStats = {
        orders: prevTotalOrders,
        revenue: prevRevenue,
        discount: prevDiscount,
        newUsers: prevNewUsers,
        averageOrderValue: Math.round(prevAvgOrder * 100) / 100,
      };
    }

    // Format statistics
    const revenue = totalRevenue[0]?.total || 0;
    const discount = totalDiscount[0]?.total || 0;
    const avgOrderValue = averageOrderValue[0]?.avg || 0;

    // Format orders by status
    const statusBreakdown = ordersByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Calculate growth percentages if comparing
    const growth = previousStats
      ? {
          orders:
            previousStats.orders > 0
              ? Math.round(
                  ((totalOrders - previousStats.orders) / previousStats.orders) * 100
                )
              : totalOrders > 0
              ? 100
              : 0,
          revenue:
            previousStats.revenue > 0
              ? Math.round(((revenue - previousStats.revenue) / previousStats.revenue) * 100)
              : revenue > 0
              ? 100
              : 0,
          discount:
            previousStats.discount > 0
              ? Math.round(((discount - previousStats.discount) / previousStats.discount) * 100)
              : discount > 0
              ? 100
              : 0,
          newUsers:
            previousStats.newUsers > 0
              ? Math.round(
                  ((newUsers - previousStats.newUsers) / previousStats.newUsers) * 100
                )
              : newUsers > 0
              ? 100
              : 0,
          averageOrderValue:
            previousStats.averageOrderValue > 0
              ? Math.round(
                  ((avgOrderValue - previousStats.averageOrderValue) /
                    previousStats.averageOrderValue) *
                    100
                )
              : avgOrderValue > 0
              ? 100
              : 0,
        }
      : null;

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: {
          period: {
            type: period,
            startDate: startDate || null,
            endDate: endDate || null,
          },
          statistics: {
            orders: {
              total: totalOrders,
              byStatus: statusBreakdown,
              growth: growth?.orders || null,
            },
            revenue: {
              total: Math.round(revenue * 100) / 100,
              discount: Math.round(discount * 100) / 100,
              net: Math.round((revenue - discount) * 100) / 100,
              growth: growth?.revenue || null,
            },
            users: {
              total: totalUsers,
              new: newUsers,
              growth: growth?.newUsers || null,
            },
            products: {
              total: totalProducts,
              active: activeProducts,
              outOfStock: totalProducts - activeProducts,
            },
            carts: {
              abandoned: abandonedCarts,
            },
            averageOrderValue: {
              value: Math.round(avgOrderValue * 100) / 100,
              growth: growth?.averageOrderValue || null,
            },
          },
          previousPeriod: previousStats
            ? {
                orders: previousStats.orders,
                revenue: previousStats.revenue,
                discount: previousStats.discount,
                newUsers: previousStats.newUsers,
                averageOrderValue: previousStats.averageOrderValue,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve dashboard statistics. Please try again.",
      },
      { status: 500 }
    );
  }
}


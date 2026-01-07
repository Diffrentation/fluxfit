import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/user-registrations
 * Get user registration trends
 * 
 * Query Parameters:
 * - period: Time period - "daily", "monthly", "yearly" (default: "daily")
 * - days: Number of days for daily period (default: 30, max: 365)
 * - months: Number of months for monthly period (default: 12, max: 24)
 * - years: Number of years for yearly period (default: 5, max: 10)
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
    const period = searchParams.get("period") || "daily";
    const days = Math.min(parseInt(searchParams.get("days")) || 30, 365);
    const months = Math.min(parseInt(searchParams.get("months")) || 12, 24);
    const years = Math.min(parseInt(searchParams.get("years")) || 5, 10);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate, groupFormat;

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
          break;
        case "monthly":
          queryStartDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
          queryEndDate = new Date(now);
          groupFormat = "%Y-%m";
          break;
        case "yearly":
          queryStartDate = new Date(now.getFullYear() - years, 0, 1);
          queryEndDate = new Date(now);
          groupFormat = "%Y";
          break;
        default:
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - 30);
          queryEndDate = new Date(now);
          groupFormat = "%Y-%m-%d";
      }
    }

    // Build query
    const userQuery = {
      isdeleted: false,
      createdAt: { $gte: queryStartDate, $lte: queryEndDate },
    };

    // Aggregate user registrations
    const registrationData = await User.aggregate([
      { $match: userQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$createdAt" },
          },
          count: { $sum: 1 },
          blocked: {
            $sum: { $cond: [{ $eq: ["$isblocked", true] }, 1, 0] },
          },
          active: {
            $sum: { $cond: [{ $eq: ["$isblocked", false] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get total statistics
    const [
      totalUsers,
      newUsers,
      blockedUsers,
      activeUsers,
      usersByRole,
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isdeleted: false }),
      // New users in period
      User.countDocuments(userQuery),
      // Blocked users
      User.countDocuments({ isdeleted: false, isblocked: true }),
      // Active users
      User.countDocuments({ isdeleted: false, isblocked: false }),
      // Users by role
      User.aggregate([
        { $match: { isdeleted: false } },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format registration data
    const formattedData = registrationData.map((item) => ({
      date: item._id,
      count: item.count,
      blocked: item.blocked,
      active: item.active,
    }));

    // Format users by role
    const roleBreakdown = usersByRole.map((item) => ({
      role: item._id || "user",
      count: item.count,
      percentage: totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0,
    }));

    // Calculate growth (compare with previous period)
    let growth = null;
    if (period === "daily" || period === "monthly") {
      const previousStartDate = new Date(queryStartDate);
      const previousEndDate = new Date(queryStartDate);
      const periodDays = Math.ceil((queryEndDate - queryStartDate) / (1000 * 60 * 60 * 24));

      if (period === "daily") {
        previousStartDate.setDate(previousStartDate.getDate() - periodDays);
      } else {
        previousStartDate.setMonth(previousStartDate.getMonth() - periodDays / 30);
      }

      const previousUsers = await User.countDocuments({
        isdeleted: false,
        createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      });

      if (previousUsers > 0) {
        growth = Math.round(((newUsers - previousUsers) / previousUsers) * 100);
      } else if (newUsers > 0) {
        growth = 100;
      }
    }

    // Calculate average daily/monthly registrations
    const periodDays = Math.ceil((queryEndDate - queryStartDate) / (1000 * 60 * 60 * 24));
    const averageRegistrations =
      periodDays > 0 ? Math.round((newUsers / periodDays) * 100) / 100 : 0;

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User registration trends retrieved successfully",
        data: {
          period: {
            type: period,
            startDate: queryStartDate,
            endDate: queryEndDate,
          },
          summary: {
            totalUsers: totalUsers,
            newUsers: newUsers,
            blockedUsers: blockedUsers,
            activeUsers: activeUsers,
            growth: growth,
            averageRegistrations: averageRegistrations,
          },
          byRole: roleBreakdown,
          trends: formattedData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user registrations error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve user registration trends. Please try again.",
      },
      { status: 500 }
    );
  }
}


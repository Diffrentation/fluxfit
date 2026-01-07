import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settlement from "@/models/settlement.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/finance/commissions
 * Get commission tracking
 * 
 * Query Parameters:
 * - vendor: Filter by vendor ID (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - period: Time period - "day", "week", "month", "year" (default: "month")
 * - groupBy: Group by - "vendor", "period", "settlement" (default: "period")
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
    const vendor = searchParams.get("vendor");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "month";
    const groupBy = searchParams.get("groupBy") || "period";

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      switch (period) {
        case "day":
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
        default:
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          queryEndDate = new Date();
      }
    }

    // Build query
    const query = {
      "period.startDate": { $gte: queryStartDate },
      "period.endDate": { $lte: queryEndDate },
    };

    if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
      query.vendor = vendor;
    }

    // Get commission data based on groupBy
    let commissionData = [];
    let summary = {};

    switch (groupBy) {
      case "vendor":
        commissionData = await Settlement.aggregate([
          { $match: query },
          {
            $group: {
              _id: "$vendor",
              totalSales: { $sum: "$summary.totalSales" },
              totalCommission: { $sum: "$summary.totalCommission" },
              totalOrders: { $sum: "$summary.totalOrders" },
              averageCommissionRate: { $avg: "$summary.commissionRate" },
              settlementCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "vendorData",
            },
          },
          { $unwind: { path: "$vendorData", preserveNullAndEmptyArrays: true } },
          { $sort: { totalCommission: -1 } },
        ]);

        commissionData = commissionData.map((item) => ({
          vendor: item.vendorData
            ? {
                id: item._id,
                name: `${item.vendorData.firstname} ${item.vendorData.lastname}`,
                email: item.vendorData.email,
              }
            : { id: null, name: "Platform", email: null },
          totalSales: Math.round(item.totalSales * 100) / 100,
          totalCommission: Math.round(item.totalCommission * 100) / 100,
          totalOrders: item.totalOrders,
          averageCommissionRate: Math.round(item.averageCommissionRate * 100) / 100,
          settlementCount: item.settlementCount,
        }));

        summary = {
          totalVendors: commissionData.length,
          totalSales: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalSales, 0) * 100
          ) / 100,
          totalCommission: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalCommission, 0) * 100
          ) / 100,
        };
        break;

      case "settlement":
        const settlements = await Settlement.find(query)
          .populate("vendor", "firstname lastname email")
          .sort({ createdAt: -1 })
          .lean();

        commissionData = settlements.map((settlement) => ({
          settlementId: settlement._id,
          vendor: settlement.vendor
            ? {
                id: settlement.vendor._id,
                name: `${settlement.vendor.firstname} ${settlement.vendor.lastname}`,
                email: settlement.vendor.email,
              }
            : null,
          period: {
            startDate: settlement.period.startDate,
            endDate: settlement.period.endDate,
          },
          totalSales: Math.round(settlement.summary.totalSales * 100) / 100,
          totalCommission: Math.round(settlement.summary.totalCommission * 100) / 100,
          commissionRate: settlement.summary.commissionRate,
          totalOrders: settlement.summary.totalOrders,
          status: settlement.status,
          createdAt: settlement.createdAt,
        }));

        summary = {
          totalSettlements: commissionData.length,
          totalSales: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalSales, 0) * 100
          ) / 100,
          totalCommission: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalCommission, 0) * 100
          ) / 100,
        };
        break;

      case "period":
      default:
        let groupFormat = "%Y-%m";
        if (period === "day") {
          groupFormat = "%Y-%m-%d";
        } else if (period === "week") {
          groupFormat = "%Y-W%V";
        } else if (period === "year") {
          groupFormat = "%Y";
        }

        commissionData = await Settlement.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                $dateToString: { format: groupFormat, date: "$period.startDate" },
              },
              totalSales: { $sum: "$summary.totalSales" },
              totalCommission: { $sum: "$summary.totalCommission" },
              totalOrders: { $sum: "$summary.totalOrders" },
              averageCommissionRate: { $avg: "$summary.commissionRate" },
              settlementCount: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        commissionData = commissionData.map((item) => ({
          period: item._id,
          totalSales: Math.round(item.totalSales * 100) / 100,
          totalCommission: Math.round(item.totalCommission * 100) / 100,
          totalOrders: item.totalOrders,
          averageCommissionRate: Math.round(item.averageCommissionRate * 100) / 100,
          settlementCount: item.settlementCount,
        }));

        summary = {
          totalPeriods: commissionData.length,
          totalSales: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalSales, 0) * 100
          ) / 100,
          totalCommission: Math.round(
            commissionData.reduce((sum, item) => sum + item.totalCommission, 0) * 100
          ) / 100,
        };
        break;
    }

    // Calculate overall statistics
    const overallStats = await Settlement.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$summary.totalSales" },
          totalCommission: { $sum: "$summary.totalCommission" },
          totalOrders: { $sum: "$summary.totalOrders" },
          averageCommissionRate: { $avg: "$summary.commissionRate" },
        },
      },
    ]);

    const overall = overallStats[0] || {
      totalSales: 0,
      totalCommission: 0,
      totalOrders: 0,
      averageCommissionRate: 0,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Commission tracking data retrieved successfully",
        data: {
          period: {
            startDate: queryStartDate,
            endDate: queryEndDate,
          },
          groupBy: groupBy,
          overall: {
            totalSales: Math.round(overall.totalSales * 100) / 100,
            totalCommission: Math.round(overall.totalCommission * 100) / 100,
            totalOrders: overall.totalOrders,
            averageCommissionRate: Math.round(overall.averageCommissionRate * 100) / 100,
            commissionPercentage: overall.totalSales > 0
              ? Math.round((overall.totalCommission / overall.totalSales) * 100 * 100) / 100
              : 0,
          },
          summary: summary,
          data: commissionData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get commission tracking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve commission tracking. Please try again.",
      },
      { status: 500 }
    );
  }
}


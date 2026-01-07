import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import { authenticateAdmin } from "@/lib/auth";
import dayjs from "dayjs";

/**
 * GET /api/admin/refunds/reports
 * Get refund reports
 * 
 * Query Parameters:
 * - period: Time period - "day", "week", "month", "year", "custom" (default: "month")
 * - startDate: Start date (ISO format, required if period is "custom")
 * - endDate: End date (ISO format, required if period is "custom")
 * - groupBy: Group by - "day", "week", "month", "status", "gateway", "method" (default: "day")
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
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day";

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate;

    if (period === "custom" && startDate && endDate) {
      queryStartDate = dayjs(startDate).startOf("day").toDate();
      queryEndDate = dayjs(endDate).endOf("day").toDate();
    } else {
      switch (period) {
        case "day":
          queryStartDate = dayjs(now).startOf("day").toDate();
          queryEndDate = dayjs(now).endOf("day").toDate();
          break;
        case "week":
          queryStartDate = dayjs(now).subtract(7, "day").startOf("day").toDate();
          queryEndDate = dayjs(now).endOf("day").toDate();
          break;
        case "month":
          queryStartDate = dayjs(now).startOf("month").toDate();
          queryEndDate = dayjs(now).endOf("day").toDate();
          break;
        case "year":
          queryStartDate = dayjs(now).startOf("year").toDate();
          queryEndDate = dayjs(now).endOf("day").toDate();
          break;
        default:
          queryStartDate = dayjs(now).startOf("month").toDate();
          queryEndDate = dayjs(now).endOf("day").toDate();
      }
    }

    // Get all payments with refunds in the date range
    const payments = await Payment.find({
      refunds: { $exists: true, $ne: [] },
      createdAt: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    }).lean();

    // Extract all refunds
    const allRefunds = [];
    payments.forEach((payment) => {
      payment.refunds.forEach((refund) => {
        if (refund.createdAt >= queryStartDate && refund.createdAt <= queryEndDate) {
          allRefunds.push({
            ...refund,
            paymentId: payment._id,
            gateway: payment.gateway,
            method: payment.method,
            currency: payment.currency,
          });
        }
      });
    });

    // Calculate overall statistics
    const overallStats = {
      total: allRefunds.length,
      totalAmount: allRefunds.reduce((sum, r) => sum + r.amount, 0),
      byStatus: {
        pending: allRefunds.filter((r) => r.status === "pending").length,
        processing: allRefunds.filter((r) => r.status === "processing").length,
        completed: allRefunds.filter((r) => r.status === "completed").length,
        failed: allRefunds.filter((r) => r.status === "failed").length,
      },
      byStatusAmount: {
        pending: allRefunds.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
        processing: allRefunds.filter((r) => r.status === "processing").reduce((sum, r) => sum + r.amount, 0),
        completed: allRefunds.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.amount, 0),
        failed: allRefunds.filter((r) => r.status === "failed").reduce((sum, r) => sum + r.amount, 0),
      },
    };

    // Group data based on groupBy parameter
    let groupedData = {};

    switch (groupBy) {
      case "status":
        groupedData = {
          pending: {
            count: overallStats.byStatus.pending,
            amount: Math.round(overallStats.byStatusAmount.pending * 100) / 100,
          },
          processing: {
            count: overallStats.byStatus.processing,
            amount: Math.round(overallStats.byStatusAmount.processing * 100) / 100,
          },
          completed: {
            count: overallStats.byStatus.completed,
            amount: Math.round(overallStats.byStatusAmount.completed * 100) / 100,
          },
          failed: {
            count: overallStats.byStatus.failed,
            amount: Math.round(overallStats.byStatusAmount.failed * 100) / 100,
          },
        };
        break;

      case "gateway":
        const gatewayGroups = {};
        allRefunds.forEach((refund) => {
          const gateway = refund.gateway || "other";
          if (!gatewayGroups[gateway]) {
            gatewayGroups[gateway] = { count: 0, amount: 0 };
          }
          gatewayGroups[gateway].count += 1;
          gatewayGroups[gateway].amount += refund.amount;
        });
        Object.keys(gatewayGroups).forEach((key) => {
          groupedData[key] = {
            count: gatewayGroups[key].count,
            amount: Math.round(gatewayGroups[key].amount * 100) / 100,
          };
        });
        break;

      case "method":
        const methodGroups = {};
        allRefunds.forEach((refund) => {
          const method = refund.method || "other";
          if (!methodGroups[method]) {
            methodGroups[method] = { count: 0, amount: 0 };
          }
          methodGroups[method].count += 1;
          methodGroups[method].amount += refund.amount;
        });
        Object.keys(methodGroups).forEach((key) => {
          groupedData[key] = {
            count: methodGroups[key].count,
            amount: Math.round(methodGroups[key].amount * 100) / 100,
          };
        });
        break;

      case "day":
      case "week":
      case "month":
      default:
        const dateFormat = groupBy === "day" ? "YYYY-MM-DD" : groupBy === "week" ? "YYYY-WW" : "YYYY-MM";
        const dateGroups = {};
        allRefunds.forEach((refund) => {
          const dateKey = dayjs(refund.createdAt).format(dateFormat);
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = { count: 0, amount: 0 };
          }
          dateGroups[dateKey].count += 1;
          dateGroups[dateKey].amount += refund.amount;
        });
        Object.keys(dateGroups)
          .sort()
          .forEach((key) => {
            groupedData[key] = {
              count: dateGroups[key].count,
              amount: Math.round(dateGroups[key].amount * 100) / 100,
            };
          });
        break;
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Refund reports retrieved successfully",
        data: {
          period: {
            startDate: queryStartDate,
            endDate: queryEndDate,
            type: period,
          },
          statistics: {
            total: overallStats.total,
            totalAmount: Math.round(overallStats.totalAmount * 100) / 100,
            byStatus: overallStats.byStatus,
            byStatusAmount: {
              pending: Math.round(overallStats.byStatusAmount.pending * 100) / 100,
              processing: Math.round(overallStats.byStatusAmount.processing * 100) / 100,
              completed: Math.round(overallStats.byStatusAmount.completed * 100) / 100,
              failed: Math.round(overallStats.byStatusAmount.failed * 100) / 100,
            },
          },
          groupedData: groupedData,
          groupBy: groupBy,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get refund reports error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve refund reports. Please try again.",
      },
      { status: 500 }
    );
  }
}


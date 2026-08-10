import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Payment from "@/models/payment.model";
import Settlement from "@/models/settlement.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/finance
 * Single-page finance overview combining orders, payments, refunds, tax and
 * settlements — the summary dashboard endpoint that the detailed reports
 * (/api/admin/reports/*) and vendor-focused commissions endpoint don't
 * provide on their own.
 *
 * Query Parameters:
 * - period: "day", "week", "month", "year" (default: "month") — used when
 *   startDate/endDate are not both supplied
 * - startDate, endDate: ISO dates (optional, override `period`)
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    let queryStartDate;
    let queryEndDate = now;

    if (startDateParam && endDateParam) {
      queryStartDate = new Date(startDateParam);
      queryEndDate = new Date(endDateParam);
    } else {
      switch (period) {
        case "day":
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - 7);
          break;
        case "year":
          queryStartDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "month":
        default:
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    const dateMatch = { createdAt: { $gte: queryStartDate, $lte: queryEndDate } };

    const [
      orderTotals,
      ordersByStatus,
      paymentsByMethod,
      refundAgg,
      pendingSettlementAgg,
      completedSettlementAgg,
      dailyTrend,
    ] = await Promise.all([
      Order.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: null,
            grossRevenue: { $sum: "$total" },
            subtotal: { $sum: "$subtotal" },
            discount: { $sum: "$discount" },
            taxCollected: { $sum: "$tax.total" },
            shippingCollected: { $sum: "$shipping.cost" },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: dateMatch },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
      ]),
      Payment.aggregate([
        { $match: { ...dateMatch, status: "completed" } },
        { $group: { _id: "$method", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: dateMatch },
        { $unwind: "$refunds" },
        {
          $group: {
            _id: "$refunds.status",
            count: { $sum: 1 },
            amount: { $sum: "$refunds.amount" },
          },
        },
      ]),
      Settlement.aggregate([
        { $match: { status: { $in: ["pending", "processing"] } } },
        { $group: { _id: null, amount: { $sum: "$summary.netAmount" }, count: { $sum: 1 } } },
      ]),
      Settlement.aggregate([
        { $match: { status: "completed", ...dateMatch } },
        { $group: { _id: null, amount: { $sum: "$summary.netAmount" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totals = orderTotals[0] || {
      grossRevenue: 0,
      subtotal: 0,
      discount: 0,
      taxCollected: 0,
      shippingCollected: 0,
      orderCount: 0,
    };

    const refundTotals = { pending: 0, completed: 0, failed: 0, processing: 0 };
    let refundCount = 0;
    refundAgg.forEach((r) => {
      refundTotals[r._id] = Math.round(r.amount * 100) / 100;
      refundCount += r.count;
    });
    const totalRefunded = refundTotals.completed || 0;

    const round2 = (n) => Math.round((n || 0) * 100) / 100;

    return NextResponse.json(
      {
        success: true,
        message: "Finance overview retrieved successfully",
        data: {
          period: { startDate: queryStartDate, endDate: queryEndDate, label: period },
          revenue: {
            gross: round2(totals.grossRevenue),
            net: round2(totals.grossRevenue - totalRefunded),
            subtotal: round2(totals.subtotal),
            discount: round2(totals.discount),
            taxCollected: round2(totals.taxCollected),
            shippingCollected: round2(totals.shippingCollected),
            orderCount: totals.orderCount,
            averageOrderValue:
              totals.orderCount > 0 ? round2(totals.grossRevenue / totals.orderCount) : 0,
          },
          ordersByStatus: ordersByStatus.map((s) => ({
            status: s._id,
            count: s.count,
            total: round2(s.total),
          })),
          paymentsByMethod: paymentsByMethod.map((p) => ({
            method: p._id,
            count: p.count,
            amount: round2(p.amount),
          })),
          refunds: {
            total: refundCount,
            pendingAmount: refundTotals.pending,
            processingAmount: refundTotals.processing,
            completedAmount: refundTotals.completed,
            failedAmount: refundTotals.failed,
          },
          settlements: {
            pendingAmount: round2(pendingSettlementAgg[0]?.amount),
            pendingCount: pendingSettlementAgg[0]?.count || 0,
            completedAmount: round2(completedSettlementAgg[0]?.amount),
            completedCount: completedSettlementAgg[0]?.count || 0,
          },
          dailyTrend: dailyTrend.map((d) => ({
            date: d._id,
            revenue: round2(d.revenue),
            orders: d.orders,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get finance overview error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve finance overview. Please try again.",
      },
      { status: 500 }
    );
  }
}

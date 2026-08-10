import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/refunds/:id
 * Get refund detail(s) for a single payment (the :id param is the Payment
 * ObjectId, matching how approve/reject identify it — refunds live as
 * sub-documents on Payment.refunds[], not as their own collection).
 *
 * Query Parameters:
 * - refundIndex: Index into payment.refunds[] (optional — if omitted,
 *   returns all refunds recorded against this payment)
 */
export async function GET(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const refundIndexParam = searchParams.get("refundIndex");

    const payment = await Payment.findById(id)
      .populate("order", "orderNumber total status")
      .populate("user", "firstname lastname email")
      .lean();

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    const paymentSummary = {
      id: payment._id,
      order: payment.order
        ? {
            id: payment.order._id,
            orderNumber: payment.order.orderNumber,
            total: payment.order.total,
            status: payment.order.status,
          }
        : null,
      user: payment.user
        ? {
            id: payment.user._id,
            name: `${payment.user.firstname} ${payment.user.lastname}`,
            email: payment.user.email,
          }
        : null,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      gateway: payment.gateway,
      status: payment.status,
      totalRefunded: payment.totalRefunded,
    };

    const formatRefund = (refund, index) => ({
      id: `${payment._id}_${index}`,
      paymentId: payment._id,
      refundIndex: index,
      amount: Math.round((refund.amount || 0) * 100) / 100,
      reason: refund.reason,
      refundId: refund.refundId,
      status: refund.status,
      processedAt: refund.processedAt,
      createdAt: refund.createdAt,
      payment: paymentSummary,
    });

    if (refundIndexParam !== null && refundIndexParam !== "") {
      const refundIndex = parseInt(refundIndexParam, 10);
      const refund = payment.refunds?.[refundIndex];
      if (!refund) {
        return NextResponse.json(
          { success: false, message: "Refund not found at that index" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: true,
          message: "Refund retrieved successfully",
          data: { refund: formatRefund(refund, refundIndex) },
        },
        { status: 200 }
      );
    }

    const refunds = (payment.refunds || []).map((r, i) => formatRefund(r, i));

    return NextResponse.json(
      {
        success: true,
        message: "Refunds retrieved successfully",
        data: { payment: paymentSummary, refunds },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get refund detail error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve refund. Please try again.",
      },
      { status: 500 }
    );
  }
}

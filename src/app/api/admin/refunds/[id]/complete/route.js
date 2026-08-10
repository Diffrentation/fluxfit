import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import mongoose from "mongoose";

/**
 * POST /api/admin/refunds/:id/complete
 * Mark a "processing" refund as completed — for COD (and any other
 * non-gateway) payments the money is returned manually (cash/bank
 * transfer) outside the app, so there's no webhook to auto-complete it the
 * way Razorpay refunds are (see /api/payments/webhook's refund.processed
 * handler). This is that manual confirmation step.
 *
 * Deliberately restricted to non-Razorpay payments: a Razorpay refund
 * already gets marked "processing" by /approve and should complete via
 * its own webhook, not be short-circuited here.
 *
 * Request Body:
 * - refundIndex: Index of refund in payment.refunds array (required if multiple refunds)
 */
export async function POST(request, { params }) {
  try {
    const { error, user: adminUser } = await authenticateAdmin(request);
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

    const body = await request.json();
    const { refundIndex } = body;

    const payment = await Payment.findById(id)
      .populate("order")
      .populate("user", "firstname lastname email")
      .lean();

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.gateway === "razorpay") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay refunds complete automatically via webhook once Razorpay processes them — they can't be marked complete manually.",
        },
        { status: 400 }
      );
    }

    let refundToComplete = null;
    let refundIndexToUse = null;

    if (refundIndex !== undefined) {
      if (payment.refunds[refundIndex] && payment.refunds[refundIndex].status === "processing") {
        refundToComplete = payment.refunds[refundIndex];
        refundIndexToUse = refundIndex;
      }
    } else {
      for (let i = 0; i < payment.refunds.length; i++) {
        if (payment.refunds[i].status === "processing") {
          refundToComplete = payment.refunds[i];
          refundIndexToUse = i;
          break;
        }
      }
    }

    if (!refundToComplete) {
      return NextResponse.json(
        { success: false, message: "No processing refund found for this payment" },
        { status: 400 }
      );
    }

    const paymentDoc = await Payment.findById(id);
    paymentDoc.refunds[refundIndexToUse].status = "completed";
    paymentDoc.refunds[refundIndexToUse].processedAt = new Date();
    await paymentDoc.save();

    const updatedPayment = await Payment.findById(id)
      .populate("order", "orderNumber total status")
      .populate("user", "firstname lastname email")
      .lean();

    const completedRefund = updatedPayment.refunds[refundIndexToUse];

    if (updatedPayment.user?.email) {
      sendOrderStatusUpdateEmail(updatedPayment.user.email, {
        orderId: updatedPayment.order?.orderNumber || "",
        status: updatedPayment.order?.status || updatedPayment.status,
        customerName: updatedPayment.user.firstname
          ? `${updatedPayment.user.firstname} ${updatedPayment.user.lastname || ""}`.trim()
          : undefined,
        note: `Your refund of ₹${completedRefund.amount} has been completed.`,
      }).catch((err) =>
        console.error("Failed to send refund-completed email:", err)
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Refund marked as completed",
        data: {
          refund: {
            id: `${payment._id}_${refundIndexToUse}`,
            paymentId: payment._id,
            amount: Math.round(completedRefund.amount * 100) / 100,
            status: completedRefund.status,
            processedAt: completedRefund.processedAt,
          },
          payment: {
            id: updatedPayment._id,
            totalRefunded: updatedPayment.totalRefunded,
            status: updatedPayment.status,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete refund error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to complete refund. Please try again.",
      },
      { status: 500 }
    );
  }
}

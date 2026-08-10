import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import mongoose from "mongoose";

/**
 * POST /api/admin/refunds/:id/reject
 * Reject refund
 * 
 * Request Body:
 * - refundIndex: Index of refund in payment.refunds array (required if multiple refunds)
 * - reason: Rejection reason (required)
 */
export async function POST(request, { params }) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get payment ID (the :id parameter)
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID",
        },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { refundIndex, reason } = body;

    // Validate rejection reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required",
          errors: [
            {
              field: "reason",
              message: "Rejection reason is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await Payment.findById(id)
      .populate("order")
      .populate("user", "firstname lastname email")
      .lean();

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        { status: 404 }
      );
    }

    // Find pending refund
    let refundToReject = null;
    let refundIndexToUse = null;

    if (refundIndex !== undefined) {
      // Use specified index
      if (payment.refunds[refundIndex] && payment.refunds[refundIndex].status === "pending") {
        refundToReject = payment.refunds[refundIndex];
        refundIndexToUse = refundIndex;
      }
    } else {
      // Find first pending refund
      for (let i = 0; i < payment.refunds.length; i++) {
        if (payment.refunds[i].status === "pending") {
          refundToReject = payment.refunds[i];
          refundIndexToUse = i;
          break;
        }
      }
    }

    if (!refundToReject) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending refund found for this payment",
        },
        { status: 400 }
      );
    }

    // Reload payment as document (not lean) to update
    const paymentDoc = await Payment.findById(id);

    // Reject refund - remove it from the array and adjust totalRefunded
    const refundAmount = paymentDoc.refunds[refundIndexToUse].amount;
    paymentDoc.refunds[refundIndexToUse].status = "failed";
    paymentDoc.refunds[refundIndexToUse].reason = `${paymentDoc.refunds[refundIndexToUse].reason || ""} [REJECTED: ${reason.trim()}]`.trim();

    // Update totalRefunded (subtract the rejected refund amount)
    paymentDoc.totalRefunded = Math.max(0, paymentDoc.totalRefunded - refundAmount);

    // Update payment status if it was fully refunded
    if (paymentDoc.totalRefunded < paymentDoc.amount && paymentDoc.status === "refunded") {
      paymentDoc.status = "completed";
    }

    // Add admin notes
    paymentDoc.notes = reason.trim();

    await paymentDoc.save();

    // Reload to get updated data
    const updatedPayment = await Payment.findById(id)
      .populate("order", "orderNumber total status")
      .populate("user", "firstname lastname email")
      .lean();

    // Format response
    const rejectedRefund = updatedPayment.refunds[refundIndexToUse];

    // Notify the customer by email (best-effort, does not block the response)
    if (updatedPayment.user?.email) {
      sendOrderStatusUpdateEmail(updatedPayment.user.email, {
        orderId: updatedPayment.order?.orderNumber || "",
        status: updatedPayment.order?.status || updatedPayment.status,
        customerName: updatedPayment.user.firstname
          ? `${updatedPayment.user.firstname} ${updatedPayment.user.lastname || ""}`.trim()
          : undefined,
        note: `Your refund request for ₹${rejectedRefund.amount} was rejected. Reason: ${reason.trim()}`,
      }).catch((err) =>
        console.error("Failed to send refund-rejected email:", err)
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Refund rejected successfully",
        data: {
          refund: {
            id: `${payment._id}_${refundIndexToUse}`,
            paymentId: payment._id,
            amount: Math.round(rejectedRefund.amount * 100) / 100,
            reason: rejectedRefund.reason,
            status: rejectedRefund.status,
            createdAt: rejectedRefund.createdAt,
          },
          payment: {
            id: updatedPayment._id,
            order: updatedPayment.order
              ? {
                  id: updatedPayment.order._id,
                  orderNumber: updatedPayment.order.orderNumber,
                  total: updatedPayment.order.total,
                  status: updatedPayment.order.status,
                }
              : null,
            totalRefunded: updatedPayment.totalRefunded,
            status: updatedPayment.status,
          },
          rejectionReason: reason.trim(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject refund error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to reject refund. Please try again.",
      },
      { status: 500 }
    );
  }
}


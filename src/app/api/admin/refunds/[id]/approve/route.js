import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import { refundRazorpayPayment } from "@/lib/razorpay";
import mongoose from "mongoose";

/**
 * POST /api/admin/refunds/:id/approve
 * Approve refund
 * 
 * Request Body:
 * - refundIndex: Index of refund in payment.refunds array (required if multiple refunds)
 * - notes: Admin notes (optional)
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
    const { refundIndex, notes } = body;

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
    let refundToProcess = null;
    let refundIndexToUse = null;

    if (refundIndex !== undefined) {
      // Use specified index
      if (payment.refunds[refundIndex] && payment.refunds[refundIndex].status === "pending") {
        refundToProcess = payment.refunds[refundIndex];
        refundIndexToUse = refundIndex;
      }
    } else {
      // Find first pending refund
      for (let i = 0; i < payment.refunds.length; i++) {
        if (payment.refunds[i].status === "pending") {
          refundToProcess = payment.refunds[i];
          refundIndexToUse = i;
          break;
        }
      }
    }

    if (!refundToProcess) {
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

    // Process refund based on gateway
    let razorpayRefund = null;
    if (payment.gateway === "razorpay" && payment.paymentId) {
      try {
        // Process refund via Razorpay
        razorpayRefund = await refundRazorpayPayment(
          payment.paymentId,
          refundToProcess.amount,
          {
            notes: {
              reason: refundToProcess.reason || "Admin approved refund",
              adminNotes: notes || null,
            },
          }
        );

        // Update refund with Razorpay refund ID
        paymentDoc.refunds[refundIndexToUse].refundId = razorpayRefund.id;
        paymentDoc.refunds[refundIndexToUse].status = "processing";
      } catch (error) {
        console.error("Razorpay refund error:", error);
        // Mark as failed if Razorpay refund fails
        paymentDoc.refunds[refundIndexToUse].status = "failed";
        await paymentDoc.save();

        return NextResponse.json(
          {
            success: false,
            message: `Failed to process refund via ${payment.gateway}: ${error.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      // For COD or other gateways, mark as processing
      paymentDoc.refunds[refundIndexToUse].status = "processing";
    }

    // Add admin notes if provided
    if (notes) {
      paymentDoc.notes = notes;
    }

    await paymentDoc.save();

    // Reload to get updated data
    const updatedPayment = await Payment.findById(id)
      .populate("order", "orderNumber total status")
      .populate("user", "firstname lastname email")
      .lean();

    // Format response
    const processedRefund = updatedPayment.refunds[refundIndexToUse];

    return NextResponse.json(
      {
        success: true,
        message: "Refund approved and processing initiated",
        data: {
          refund: {
            id: `${payment._id}_${refundIndexToUse}`,
            paymentId: payment._id,
            amount: Math.round(processedRefund.amount * 100) / 100,
            reason: processedRefund.reason,
            refundId: processedRefund.refundId,
            status: processedRefund.status,
            processedAt: processedRefund.processedAt,
            createdAt: processedRefund.createdAt,
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
          },
          gatewayResponse: razorpayRefund || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve refund error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to approve refund. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/payments/:id
 * Get payment details
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get payment ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID",
        },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await Payment.findOne({
      _id: id,
      user: user._id,
    })
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

    // Format payment
    const formattedPayment = {
      id: payment._id,
      order: payment.order
        ? {
            id: payment.order._id,
            orderNumber: payment.order.orderNumber,
            total: payment.order.total,
            status: payment.order.status,
            items: payment.order.items || [],
            shippingAddress: payment.order.shippingAddress,
            billingAddress: payment.order.billingAddress,
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
      transactionId: payment.transactionId,
      paymentId: payment.paymentId,
      paymentIntentId: payment.paymentIntentId,
      initiatedAt: payment.initiatedAt,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      failureCode: payment.failureCode,
      refunds: payment.refunds || [],
      totalRefunded: payment.totalRefunded || 0,
      refundableAmount: payment.amount - (payment.totalRefunded || 0),
      tax: payment.tax || { gst: 0, total: 0 },
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Payment details retrieved successfully",
        data: {
          payment: formattedPayment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get payment details error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve payment details. Please try again.",
      },
      { status: 500 }
    );
  }
}


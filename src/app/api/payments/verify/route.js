import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Payment from "@/models/payment.model";
import { authenticateUser } from "@/lib/auth";
import { verifyRazorpaySignature, getRazorpayPayment } from "@/lib/razorpay";
import mongoose from "mongoose";

/**
 * POST /api/payments/verify
 * Verify payment
 *
 * Request Body:
 * - orderId: Order ID (required)
 * - razorpay_order_id: Razorpay order ID (required)
 * - razorpay_payment_id: Razorpay payment ID (required)
 * - razorpay_signature: Razorpay signature (required)
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get request body
    const body = await request.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Validate required fields
    const errors = [];
    if (!orderId) {
      errors.push({ field: "orderId", message: "Order ID is required" });
    }
    if (!razorpay_order_id) {
      errors.push({
        field: "razorpay_order_id",
        message: "Razorpay order ID is required",
      });
    }
    if (!razorpay_payment_id) {
      errors.push({
        field: "razorpay_payment_id",
        message: "Razorpay payment ID is required",
      });
    }
    if (!razorpay_signature) {
      errors.push({
        field: "razorpay_signature",
        message: "Razorpay signature is required",
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID format",
        },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      user: user._id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Verify Razorpay signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature. Payment verification failed.",
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await getRazorpayPayment(razorpay_payment_id);

    // Check if payment is successful
    if (
      razorpayPayment.status !== "captured" &&
      razorpayPayment.status !== "authorized"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment not successful. Status: ${razorpayPayment.status}`,
        },
        { status: 400 }
      );
    }

    // Find or create payment record
    let payment = await Payment.findOne({
      order: order._id,
      paymentIntentId: razorpay_order_id,
    });

    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: user._id,
        amount: razorpayPayment.amount / 100, // Convert from paise to rupees
        currency: razorpayPayment.currency,
        method: "razorpay",
        gateway: "razorpay",
        status: "completed",
        transactionId: razorpayPayment.id,
        paymentId: razorpayPayment.id,
        paymentIntentId: razorpay_order_id,
        gatewayResponse: razorpayPayment,
        completedAt: new Date(),
      });
    } else {
      // Update existing payment
      payment.status = "completed";
      payment.transactionId = razorpayPayment.id;
      payment.paymentId = razorpayPayment.id;
      payment.gatewayResponse = razorpayPayment;
      payment.completedAt = new Date();
    }

    await payment.save();

    // Update order payment status
    order.payment.status = "completed";
    order.payment.transactionId = razorpayPayment.id;
    order.payment.paymentId = razorpayPayment.id;
    order.payment.paidAt = new Date();
    order.status = "confirmed"; // Update order status to confirmed
    await order.save();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentId: payment._id,
          transactionId: razorpayPayment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          orderStatus: order.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to verify payment. Please try again.",
      },
      { status: 500 }
    );
  }
}

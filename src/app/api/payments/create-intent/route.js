import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Payment from "@/models/payment.model";
import { authenticateUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import mongoose from "mongoose";

/**
 * POST /api/payments/create-intent
 * Create payment intent (Razorpay order)
 *
 * Request Body:
 * - orderId: Order ID (required)
 * - method: Payment method - "razorpay" (required)
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
    const { orderId, method = "razorpay" } = body;

    // Validate orderId
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
          errors: [{ field: "orderId", message: "Order ID is required" }],
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID format",
          errors: [{ field: "orderId", message: "Invalid order ID format" }],
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

    // Check if order is already paid
    if (order.payment.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          message: "Order is already paid",
        },
        { status: 400 }
      );
    }

    // Check if payment already exists
    let payment = await Payment.findOne({
      order: order._id,
      user: user._id,
      status: { $in: ["pending", "processing"] },
    });

    // If payment exists and has paymentIntentId, return existing intent
    if (payment && payment.paymentIntentId) {
      try {
        // Verify the order still exists in Razorpay
        const { getRazorpayInstance } = await import("@/lib/razorpay");
        const razorpay = getRazorpayInstance();
        await razorpay.orders.fetch(payment.paymentIntentId);

        return NextResponse.json(
          {
            success: true,
            message: "Payment intent already created",
            data: {
              orderId: order._id,
              paymentId: payment._id,
              paymentIntentId: payment.paymentIntentId,
              amount: payment.amount,
              currency: payment.currency,
              keyId: process.env.RAZORPAY_KEY_ID,
            },
          },
          { status: 200 }
        );
      } catch (error) {
        // Order doesn't exist in Razorpay, create new one
        payment = null;
      }
    }

    // Calculate amount (in rupees)
    const amount = order.total;
    const currency = "INR";

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(amount, currency, {
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: user._id.toString(),
      },
    });

    // Create or update payment record
    if (payment) {
      payment.paymentIntentId = razorpayOrder.id;
      payment.status = "processing";
      payment.gatewayResponse = razorpayOrder;
      await payment.save();
    } else {
      payment = new Payment({
        order: order._id,
        user: user._id,
        amount: amount,
        currency: currency,
        method: method,
        gateway: "razorpay",
        status: "processing",
        paymentIntentId: razorpayOrder.id,
        gatewayResponse: razorpayOrder,
      });
      await payment.save();
    }

    // Update order payment status
    order.payment.status = "processing";
    order.payment.paymentId = razorpayOrder.id;
    await order.save();

    // Return response with Razorpay order details
    return NextResponse.json(
      {
        success: true,
        message: "Payment intent created successfully",
        data: {
          orderId: order._id,
          paymentId: payment._id,
          paymentIntentId: razorpayOrder.id,
          amount: amount,
          currency: currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          order: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            status: razorpayOrder.status,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment intent error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to create payment intent. Please try again.",
      },
      { status: 500 }
    );
  }
}

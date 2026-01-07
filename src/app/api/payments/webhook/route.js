import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Payment from "@/models/payment.model";
import { verifyRazorpaySignature, getRazorpayPayment } from "@/lib/razorpay";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler
 *
 * This endpoint handles Razorpay webhook events for payment status updates.
 * It verifies the webhook signature and processes payment events.
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Razorpay webhook secret not configured");
      return NextResponse.json(
        {
          success: false,
          message: "Webhook secret not configured",
        },
        { status: 500 }
      );
    }

    // Get request body and signature
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing webhook signature",
        },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature",
        },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log(`Razorpay webhook received: ${eventType}`, payload);

    // Handle different event types
    switch (eventType) {
      case "payment.captured":
      case "payment.authorized": {
        await handlePaymentSuccess(payload.payment.entity);
        break;
      }

      case "payment.failed": {
        await handlePaymentFailed(payload.payment.entity);
        break;
      }

      case "order.paid": {
        await handleOrderPaid(payload.order.entity);
        break;
      }

      case "refund.created":
      case "refund.processed": {
        await handleRefund(payload.refund.entity);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentEntity) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;

    // Find payment by paymentIntentId (Razorpay order ID)
    let payment = await Payment.findOne({
      paymentIntentId: orderId,
    });

    if (payment && payment.status !== "completed") {
      // Update payment status
      payment.status = "completed";
      payment.transactionId = paymentId;
      payment.paymentId = paymentId;
      payment.gatewayResponse = paymentEntity;
      payment.completedAt = new Date();
      await payment.save();

      // Update order
      const order = await Order.findById(payment.order);
      if (order) {
        order.payment.status = "completed";
        order.payment.transactionId = paymentId;
        order.payment.paymentId = paymentId;
        order.payment.paidAt = new Date();
        if (order.status === "pending") {
          order.status = "confirmed";
        }
        await order.save();
      }
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentEntity) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;

    // Find payment
    let payment = await Payment.findOne({
      paymentIntentId: orderId,
    });

    if (payment && payment.status !== "failed") {
      // Update payment status
      payment.status = "failed";
      payment.failureReason =
        paymentEntity.error_description || "Payment failed";
      payment.failureCode = paymentEntity.error_code || null;
      payment.gatewayResponse = paymentEntity;
      payment.failedAt = new Date();
      await payment.save();

      // Update order
      const order = await Order.findById(payment.order);
      if (order) {
        order.payment.status = "failed";
        await order.save();
      }
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Handle order paid event
 */
async function handleOrderPaid(orderEntity) {
  try {
    const orderId = orderEntity.id;

    // Find payment by paymentIntentId
    const payment = await Payment.findOne({
      paymentIntentId: orderId,
    });

    if (payment && payment.status !== "completed") {
      // Fetch payment details
      const razorpayPayment = await getRazorpayPayment(orderEntity.id);
      await handlePaymentSuccess(razorpayPayment);
    }
  } catch (error) {
    console.error("Error handling order paid:", error);
    throw error;
  }
}

/**
 * Handle refund event
 */
async function handleRefund(refundEntity) {
  try {
    const paymentId = refundEntity.payment_id;
    const refundId = refundEntity.id;
    const refundAmount = refundEntity.amount / 100; // Convert from paise

    // Find payment
    const payment = await Payment.findOne({
      paymentId: paymentId,
    });

    if (payment) {
      // Find or create refund record
      const refundIndex = payment.refunds.findIndex(
        (r) => r.refundId === refundId
      );

      if (refundIndex === -1) {
        // Add new refund
        payment.refunds.push({
          amount: refundAmount,
          refundId: refundId,
          status:
            refundEntity.status === "processed" ? "completed" : "processing",
          processedAt: refundEntity.status === "processed" ? new Date() : null,
          createdAt: new Date(),
        });
        payment.totalRefunded += refundAmount;

        if (payment.totalRefunded >= payment.amount) {
          payment.status = "refunded";
        }

        await payment.save();
      } else {
        // Update existing refund
        payment.refunds[refundIndex].status =
          refundEntity.status === "processed" ? "completed" : "processing";
        if (refundEntity.status === "processed") {
          payment.refunds[refundIndex].processedAt = new Date();
        }
        await payment.save();
      }
    }
  } catch (error) {
    console.error("Error handling refund:", error);
    throw error;
  }
}

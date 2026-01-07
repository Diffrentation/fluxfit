import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/payments
 * Get all payments (Admin)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status - "pending", "processing", "completed", "failed", "cancelled", "refunded" (optional)
 * - method: Filter by payment method (optional)
 * - gateway: Filter by gateway - "razorpay", "stripe", "paypal", "cod", "other" (optional)
 * - user: Filter by user ID (optional)
 * - order: Filter by order ID (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - sort: Sort order - "newest" (default), "oldest", "amount-desc", "amount-asc"
 * - minAmount: Minimum amount filter (optional)
 * - maxAmount: Maximum amount filter (optional)
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const gateway = searchParams.get("gateway");
    const userId = searchParams.get("user");
    const orderId = searchParams.get("order");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
    }

    if (gateway) {
      query.gateway = gateway;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      query.order = orderId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "amount-desc":
        sortObj.amount = -1;
        sortObj.createdAt = -1;
        break;
      case "amount-asc":
        sortObj.amount = 1;
        sortObj.createdAt = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    const skip = (page - 1) * limit;

    // Get payments
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("order", "orderNumber total status")
        .populate("user", "firstname lastname email")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    // Calculate statistics
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
          completedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          failedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, "$amount", 0],
            },
          },
          failedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },
          refundedAmount: { $sum: "$totalRefunded" },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalAmount: 0,
      totalCount: 0,
      completedAmount: 0,
      completedCount: 0,
      failedAmount: 0,
      failedCount: 0,
      refundedAmount: 0,
    };

    // Status distribution
    const statusDistribution = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const statusStats = {};
    statusDistribution.forEach((stat) => {
      statusStats[stat._id] = {
        count: stat.count,
        amount: Math.round(stat.amount * 100) / 100,
      };
    });

    // Format payments
    const formattedPayments = payments.map((payment) => ({
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
      transactionId: payment.transactionId,
      paymentId: payment.paymentId,
      paymentIntentId: payment.paymentIntentId,
      initiatedAt: payment.initiatedAt,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      failureCode: payment.failureCode,
      totalRefunded: payment.totalRefunded || 0,
      refundableAmount: payment.amount - (payment.totalRefunded || 0),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Payments retrieved successfully",
        data: {
          payments: formattedPayments,
          statistics: {
            totalAmount: Math.round(statistics.totalAmount * 100) / 100,
            totalCount: statistics.totalCount,
            completedAmount: Math.round(statistics.completedAmount * 100) / 100,
            completedCount: statistics.completedCount,
            failedAmount: Math.round(statistics.failedAmount * 100) / 100,
            failedCount: statistics.failedCount,
            refundedAmount: Math.round(statistics.refundedAmount * 100) / 100,
          },
          statusDistribution: statusStats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            status: status || null,
            method: method || null,
            gateway: gateway || null,
            user: userId || null,
            order: orderId || null,
            startDate: startDate || null,
            endDate: endDate || null,
            minAmount: minAmount || null,
            maxAmount: maxAmount || null,
            sort: sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin payments error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve payments. Please try again.",
      },
      { status: 500 }
    );
  }
}


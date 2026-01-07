import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";

/**
 * GET /api/payments
 * Get user's payment history
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status - "pending", "processing", "completed", "failed", "cancelled", "refunded" (optional)
 * - method: Filter by payment method (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - sort: Sort order - "newest" (default), "oldest", "amount-desc", "amount-asc"
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = { user: user._id };

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
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
          refundedAmount: { $sum: "$totalRefunded" },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalAmount: 0,
      totalCount: 0,
      completedAmount: 0,
      completedCount: 0,
      refundedAmount: 0,
    };

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
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      gateway: payment.gateway,
      status: payment.status,
      transactionId: payment.transactionId,
      paymentId: payment.paymentId,
      initiatedAt: payment.initiatedAt,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      totalRefunded: payment.totalRefunded,
      refundableAmount: payment.amount - (payment.totalRefunded || 0),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Payment history retrieved successfully",
        data: {
          payments: formattedPayments,
          statistics: {
            totalAmount: Math.round(statistics.totalAmount * 100) / 100,
            totalCount: statistics.totalCount,
            completedAmount: Math.round(statistics.completedAmount * 100) / 100,
            completedCount: statistics.completedCount,
            refundedAmount: Math.round(statistics.refundedAmount * 100) / 100,
          },
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
            startDate: startDate || null,
            endDate: endDate || null,
            sort: sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get payment history error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve payment history. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/refunds
 * Get all refund requests (Admin)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by refund status - "pending", "processing", "completed", "failed" (optional)
 * - paymentId: Filter by payment ID (optional)
 * - orderId: Filter by order ID (optional)
 * - userId: Filter by user ID (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - sort: Sort order - "newest" (default), "oldest", "amount-desc", "amount-asc"
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
    const paymentId = searchParams.get("paymentId");
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";

    // Build payment query
    const paymentQuery = {
      refunds: { $exists: true, $ne: [] },
    };

    if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
      paymentQuery._id = paymentId;
    }

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      paymentQuery.order = orderId;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      paymentQuery.user = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      paymentQuery.createdAt = {};
      if (startDate) {
        paymentQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        paymentQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Get payments with refunds
    const payments = await Payment.find(paymentQuery)
      .populate("order", "orderNumber total status")
      .populate("user", "firstname lastname email")
      .lean();

    // Extract refunds and filter by status
    let allRefunds = [];
    payments.forEach((payment) => {
      payment.refunds.forEach((refund, index) => {
        // Apply status filter if provided
        if (!status || refund.status === status) {
          allRefunds.push({
            id: `${payment._id}_${index}`, // Composite ID
            paymentId: payment._id,
            refundIndex: index,
            amount: refund.amount,
            reason: refund.reason,
            refundId: refund.refundId,
            status: refund.status,
            processedAt: refund.processedAt,
            createdAt: refund.createdAt,
            payment: {
              id: payment._id,
              order: payment.order,
              user: payment.user,
              amount: payment.amount,
              currency: payment.currency,
              method: payment.method,
              gateway: payment.gateway,
              totalRefunded: payment.totalRefunded,
            },
          });
        }
      });
    });

    // Sort refunds
    switch (sort) {
      case "oldest":
        allRefunds.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "amount-desc":
        allRefunds.sort((a, b) => b.amount - a.amount || new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "amount-asc":
        allRefunds.sort((a, b) => a.amount - b.amount || new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "newest":
      default:
        allRefunds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedRefunds = allRefunds.slice(skip, skip + limit);

    // Calculate statistics
    const stats = {
      total: allRefunds.length,
      totalAmount: allRefunds.reduce((sum, r) => sum + r.amount, 0),
      byStatus: {
        pending: allRefunds.filter((r) => r.status === "pending").length,
        processing: allRefunds.filter((r) => r.status === "processing").length,
        completed: allRefunds.filter((r) => r.status === "completed").length,
        failed: allRefunds.filter((r) => r.status === "failed").length,
      },
      byStatusAmount: {
        pending: allRefunds.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
        processing: allRefunds.filter((r) => r.status === "processing").reduce((sum, r) => sum + r.amount, 0),
        completed: allRefunds.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.amount, 0),
        failed: allRefunds.filter((r) => r.status === "failed").reduce((sum, r) => sum + r.amount, 0),
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Refund requests retrieved successfully",
        data: {
          refunds: paginatedRefunds.map((refund) => ({
            id: refund.id,
            paymentId: refund.paymentId,
            amount: Math.round(refund.amount * 100) / 100,
            reason: refund.reason,
            refundId: refund.refundId,
            status: refund.status,
            processedAt: refund.processedAt,
            createdAt: refund.createdAt,
            payment: {
              id: refund.payment.paymentId,
              order: refund.payment.order
                ? {
                    id: refund.payment.order._id,
                    orderNumber: refund.payment.order.orderNumber,
                    total: refund.payment.order.total,
                    status: refund.payment.order.status,
                  }
                : null,
              user: refund.payment.user
                ? {
                    id: refund.payment.user._id,
                    name: `${refund.payment.user.firstname} ${refund.payment.user.lastname}`,
                    email: refund.payment.user.email,
                  }
                : null,
              amount: refund.payment.amount,
              currency: refund.payment.currency,
              method: refund.payment.method,
              gateway: refund.payment.gateway,
              totalRefunded: refund.payment.totalRefunded,
            },
          })),
          statistics: {
            total: stats.total,
            totalAmount: Math.round(stats.totalAmount * 100) / 100,
            byStatus: stats.byStatus,
            byStatusAmount: {
              pending: Math.round(stats.byStatusAmount.pending * 100) / 100,
              processing: Math.round(stats.byStatusAmount.processing * 100) / 100,
              completed: Math.round(stats.byStatusAmount.completed * 100) / 100,
              failed: Math.round(stats.byStatusAmount.failed * 100) / 100,
            },
          },
          pagination: {
            page,
            limit,
            total: allRefunds.length,
            totalPages: Math.ceil(allRefunds.length / limit),
            hasNextPage: page < Math.ceil(allRefunds.length / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            status: status || null,
            paymentId: paymentId || null,
            orderId: orderId || null,
            userId: userId || null,
            startDate: startDate || null,
            endDate: endDate || null,
            sort: sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin refunds error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve refund requests. Please try again.",
      },
      { status: 500 }
    );
  }
}


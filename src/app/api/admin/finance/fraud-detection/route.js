import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/finance/fraud-detection
 * Get fraud detection alerts
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - severity: Filter by severity - "low", "medium", "high", "critical" (optional)
 * - type: Filter by alert type (optional)
 * - status: Filter by status - "pending", "reviewed", "resolved", "false-positive" (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
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
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Fraud detection patterns
    const fraudAlerts = [];

    // 1. High-value orders from new users
    const newUserHighValue = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["pending", "confirmed", "processing"] },
          total: { $gte: 50000 }, // Orders >= ₹50,000
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: "$userData" },
      {
        $match: {
          $expr: {
            $lt: [
              { $subtract: [new Date(), "$userData.createdAt"] },
              7 * 24 * 60 * 60 * 1000, // Created within 7 days
            ],
          },
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalAmount: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
          userData: { $first: "$userData" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 50 },
    ]);

    for (const userOrder of newUserHighValue) {
      const severity = userOrder.totalAmount >= 100000 ? "high" : "medium";
      fraudAlerts.push({
        id: `newuser-${userOrder._id}`,
        type: "high_value_new_user",
        severity: severity,
        status: "pending",
        title: `High-value order from new user`,
        description: `New user placed ${userOrder.orderCount} order(s) totaling ₹${Math.round(userOrder.totalAmount * 100) / 100}`,
        details: {
          userId: userOrder._id,
          userName: `${userOrder.userData.firstname} ${userOrder.userData.lastname}`,
          userEmail: userOrder.userData.email,
          accountAge: Math.floor(
            (new Date() - new Date(userOrder.userData.createdAt)) / (1000 * 60 * 60 * 24)
          ),
          orderCount: userOrder.orderCount,
          totalAmount: Math.round(userOrder.totalAmount * 100) / 100,
          orderIds: userOrder.orders.map((o) => o._id),
        },
        detectedAt: new Date(),
      });
    }

    // 2. Rapid order cancellation pattern
    const cancellationPattern = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "cancelled",
        },
      },
      {
        $group: {
          _id: "$user",
          cancellationCount: { $sum: 1 },
          totalCancelled: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          cancellationCount: { $gte: 3 },
        },
      },
      { $sort: { cancellationCount: -1 } },
      { $limit: 50 },
    ]);

    for (const cancelPattern of cancellationPattern) {
      const user = await User.findById(cancelPattern._id).select("firstname lastname email createdAt").lean();
      if (user) {
        const severity = cancelPattern.cancellationCount >= 5 ? "high" : "medium";
        fraudAlerts.push({
          id: `cancel-${cancelPattern._id}`,
          type: "rapid_cancellation",
          severity: severity,
          status: "pending",
          title: `Rapid order cancellation pattern`,
          description: `User cancelled ${cancelPattern.cancellationCount} orders totaling ₹${Math.round(cancelPattern.totalCancelled * 100) / 100}`,
          details: {
            userId: cancelPattern._id,
            userName: `${user.firstname} ${user.lastname}`,
            userEmail: user.email,
            cancellationCount: cancelPattern.cancellationCount,
            totalCancelled: Math.round(cancelPattern.totalCancelled * 100) / 100,
            orderIds: cancelPattern.orders.map((o) => o._id),
          },
          detectedAt: new Date(),
        });
      }
    }

    // 3. Unusual payment patterns (multiple payment methods)
    const paymentPattern = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          "payment.status": "completed",
        },
      },
      {
        $group: {
          _id: "$user",
          paymentMethods: { $addToSet: "$payment.method" },
          orderCount: { $sum: 1 },
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          $expr: { $gt: [{ $size: "$paymentMethods" }, 2] }, // More than 2 payment methods
          orderCount: { $gte: 3 },
        },
      },
      { $limit: 50 },
    ]);

    for (const payPattern of paymentPattern) {
      const user = await User.findById(payPattern._id).select("firstname lastname email").lean();
      if (user) {
        fraudAlerts.push({
          id: `payment-${payPattern._id}`,
          type: "multiple_payment_methods",
          severity: "low",
          status: "pending",
          title: `Multiple payment methods used`,
          description: `User used ${payPattern.paymentMethods.length} different payment methods for ${payPattern.orderCount} orders`,
          details: {
            userId: payPattern._id,
            userName: `${user.firstname} ${user.lastname}`,
            userEmail: user.email,
            paymentMethods: payPattern.paymentMethods,
            orderCount: payPattern.orderCount,
            orderIds: payPattern.orders.slice(0, 5).map((o) => o._id),
          },
          detectedAt: new Date(),
        });
      }
    }

    // 4. Suspicious refund patterns
    const refundPattern = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["refunded", "returned"] },
        },
      },
      {
        $group: {
          _id: "$user",
          refundCount: { $sum: 1 },
          totalRefunded: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          refundCount: { $gte: 3 },
        },
      },
      { $sort: { refundCount: -1 } },
      { $limit: 50 },
    ]);

    for (const refund of refundPattern) {
      const user = await User.findById(refund._id).select("firstname lastname email").lean();
      if (user) {
        const severity = refund.refundCount >= 5 ? "high" : "medium";
        fraudAlerts.push({
          id: `refund-${refund._id}`,
          type: "suspicious_refund_pattern",
          severity: severity,
          status: "pending",
          title: `Suspicious refund pattern`,
          description: `User has ${refund.refundCount} refunded/returned orders totaling ₹${Math.round(refund.totalRefunded * 100) / 100}`,
          details: {
            userId: refund._id,
            userName: `${user.firstname} ${user.lastname}`,
            userEmail: user.email,
            refundCount: refund.refundCount,
            totalRefunded: Math.round(refund.totalRefunded * 100) / 100,
            orderIds: refund.orders.map((o) => o._id),
          },
          detectedAt: new Date(),
        });
      }
    }

    // 5. Address mismatch patterns
    const addressMismatch = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["pending", "confirmed", "processing", "shipped"] },
        },
      },
      {
        $project: {
          user: 1,
          billingCity: "$billingAddress.city",
          billingState: "$billingAddress.state",
          shippingCity: "$shippingAddress.city",
          shippingState: "$shippingAddress.state",
          total: 1,
          orderNumber: 1,
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $ne: ["$billingCity", "$shippingCity"] },
              { $ne: ["$billingState", "$shippingState"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$user",
          mismatchCount: { $sum: 1 },
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          mismatchCount: { $gte: 2 },
        },
      },
      { $limit: 50 },
    ]);

    for (const mismatch of addressMismatch) {
      const user = await User.findById(mismatch._id).select("firstname lastname email").lean();
      if (user) {
        fraudAlerts.push({
          id: `address-${mismatch._id}`,
          type: "address_mismatch",
          severity: "low",
          status: "pending",
          title: `Billing and shipping address mismatch`,
          description: `User has ${mismatch.mismatchCount} orders with mismatched billing and shipping addresses`,
          details: {
            userId: mismatch._id,
            userName: `${user.firstname} ${user.lastname}`,
            userEmail: user.email,
            mismatchCount: mismatch.mismatchCount,
            orderIds: mismatch.orders.map((o) => o._id),
          },
          detectedAt: new Date(),
        });
      }
    }

    // Apply filters
    let filteredAlerts = fraudAlerts;

    if (severity) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severity);
    }

    if (type) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.type === type);
    }

    if (status) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === status);
    }

    // Sort by severity and detectedAt
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredAlerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.detectedAt) - new Date(a.detectedAt);
    });

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedAlerts = filteredAlerts.slice(skip, skip + limit);

    // Calculate statistics
    const stats = {
      total: filteredAlerts.length,
      bySeverity: {
        critical: filteredAlerts.filter((a) => a.severity === "critical").length,
        high: filteredAlerts.filter((a) => a.severity === "high").length,
        medium: filteredAlerts.filter((a) => a.severity === "medium").length,
        low: filteredAlerts.filter((a) => a.severity === "low").length,
      },
      byType: {},
      byStatus: {
        pending: filteredAlerts.filter((a) => a.status === "pending").length,
        reviewed: filteredAlerts.filter((a) => a.status === "reviewed").length,
        resolved: filteredAlerts.filter((a) => a.status === "resolved").length,
        "false-positive": filteredAlerts.filter((a) => a.status === "false-positive").length,
      },
    };

    filteredAlerts.forEach((alert) => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Fraud detection alerts retrieved successfully",
        data: {
          alerts: paginatedAlerts,
          statistics: stats,
          pagination: {
            page,
            limit,
            total: filteredAlerts.length,
            totalPages: Math.ceil(filteredAlerts.length / limit),
            hasNextPage: page < Math.ceil(filteredAlerts.length / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            severity: severity || null,
            type: type || null,
            status: status || null,
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get fraud detection alerts error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve fraud detection alerts. Please try again.",
      },
      { status: 500 }
    );
  }
}


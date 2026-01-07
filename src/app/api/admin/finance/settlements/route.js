import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settlement from "@/models/settlement.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/finance/settlements
 * Get settlement reports
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status - "pending", "processing", "completed", "failed", "cancelled" (optional)
 * - vendor: Filter by vendor ID (optional)
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
    const vendor = searchParams.get("vendor");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    if (status) {
      const validStatuses = ["pending", "processing", "completed", "failed", "cancelled"];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
      query.vendor = vendor;
    }

    if (startDate || endDate) {
      query["period.startDate"] = {};
      if (startDate) {
        query["period.startDate"].$gte = new Date(startDate);
      }
      if (endDate) {
        query["period.endDate"] = { $lte: new Date(endDate) };
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "amount-desc":
        sortObj["summary.netAmount"] = -1;
        break;
      case "amount-asc":
        sortObj["summary.netAmount"] = 1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get settlements and total count
    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate("vendor", "firstname lastname email")
        .populate("settlement.processedBy", "firstname lastname email")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Settlement.countDocuments(query),
    ]);

    // Format settlements
    const formattedSettlements = settlements.map((settlement) => ({
      id: settlement._id,
      vendor: settlement.vendor
        ? {
            id: settlement.vendor._id,
            name: `${settlement.vendor.firstname} ${settlement.vendor.lastname}`,
            email: settlement.vendor.email,
          }
        : null,
      period: {
        startDate: settlement.period.startDate,
        endDate: settlement.period.endDate,
      },
      summary: {
        totalSales: Math.round(settlement.summary.totalSales * 100) / 100,
        totalOrders: settlement.summary.totalOrders,
        totalRefunds: Math.round(settlement.summary.totalRefunds * 100) / 100,
        totalCommission: Math.round(settlement.summary.totalCommission * 100) / 100,
        commissionRate: settlement.summary.commissionRate,
        tax: Math.round(settlement.summary.tax * 100) / 100,
        fees: Math.round(settlement.summary.fees * 100) / 100,
        netAmount: Math.round(settlement.summary.netAmount * 100) / 100,
      },
      orderCount: settlement.orders?.length || 0,
      paymentCount: settlement.payments?.length || 0,
      status: settlement.status,
      settlement: {
        method: settlement.settlement.method,
        accountNumber: settlement.settlement.accountNumber || null,
        ifsc: settlement.settlement.ifsc || null,
        upi: settlement.settlement.upi || null,
        transactionId: settlement.settlement.transactionId || null,
        processedAt: settlement.settlement.processedAt || null,
        processedBy: settlement.settlement.processedBy
          ? {
              id: settlement.settlement.processedBy._id,
              name: `${settlement.settlement.processedBy.firstname} ${settlement.settlement.processedBy.lastname}`,
              email: settlement.settlement.processedBy.email,
            }
          : null,
      },
      notes: settlement.notes || null,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    }));

    // Calculate summary statistics
    const summary = await Settlement.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSettlements: { $sum: 1 },
          totalNetAmount: { $sum: "$summary.netAmount" },
          totalSales: { $sum: "$summary.totalSales" },
          totalRefunds: { $sum: "$summary.totalRefunds" },
          totalCommission: { $sum: "$summary.totalCommission" },
        },
      },
    ]);

    const summaryStats = summary[0] || {
      totalSettlements: 0,
      totalNetAmount: 0,
      totalSales: 0,
      totalRefunds: 0,
      totalCommission: 0,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Settlement reports retrieved successfully",
        data: {
          settlements: formattedSettlements,
          summary: {
            totalSettlements: summaryStats.totalSettlements,
            totalNetAmount: Math.round(summaryStats.totalNetAmount * 100) / 100,
            totalSales: Math.round(summaryStats.totalSales * 100) / 100,
            totalRefunds: Math.round(summaryStats.totalRefunds * 100) / 100,
            totalCommission: Math.round(summaryStats.totalCommission * 100) / 100,
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
            vendor: vendor || null,
            startDate: startDate || null,
            endDate: endDate || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get settlement reports error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve settlement reports. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/finance/settlements
 * Create settlement
 * 
 * Body Parameters:
 * - vendor: Vendor ID (optional, for multi-vendor support)
 * - period: Period object { startDate, endDate } (required)
 * - orders: Array of order IDs to include (optional)
 * - payments: Array of payment IDs to include (optional)
 * - commissionRate: Commission rate percentage (default: 0)
 * - tax: Tax amount (default: 0)
 * - fees: Fees amount (default: 0)
 * - settlement: Settlement details object (optional)
 *   - method: Settlement method - "bank", "upi", "wallet", "other" (default: "bank")
 *   - accountNumber: Bank account number (optional)
 *   - ifsc: IFSC code (optional)
 *   - upi: UPI ID (optional)
 * - notes: Notes (optional)
 */
export async function POST(request) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get body
    const body = await request.json();
    const {
      vendor,
      period,
      orders,
      payments,
      commissionRate,
      tax,
      fees,
      settlement: settlementDetails,
      notes,
    } = body;

    // Validate required fields
    if (!period || !period.startDate || !period.endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Period with startDate and endDate is required",
          errors: [
            { field: "period", message: "Period with startDate and endDate is required" },
          ],
        },
        { status: 400 }
      );
    }

    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Please use ISO format (YYYY-MM-DD)",
          errors: [
            { field: "period", message: "Start date and end date must be valid ISO date strings" },
          ],
        },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date must be before end date",
          errors: [
            { field: "period", message: "Start date must be before end date" },
          ],
        },
        { status: 400 }
      );
    }

    // Validate vendor if provided
    if (vendor) {
      if (!mongoose.Types.ObjectId.isValid(vendor)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid vendor ID",
            errors: [{ field: "vendor", message: "Valid vendor ID is required" }],
          },
          { status: 400 }
        );
      }
    }

    // Validate orders if provided
    if (orders !== undefined && Array.isArray(orders)) {
      for (const orderId of orders) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid order ID: ${orderId}`,
              errors: [
                {
                  field: "orders",
                  message: "All order IDs must be valid ObjectIds",
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate payments if provided
    if (payments !== undefined && Array.isArray(payments)) {
      for (const paymentId of payments) {
        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid payment ID: ${paymentId}`,
              errors: [
                {
                  field: "payments",
                  message: "All payment IDs must be valid ObjectIds",
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate commission rate if provided
    if (commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Commission rate must be a number between 0 and 100",
            errors: [
              {
                field: "commissionRate",
                message: "Commission rate must be a number between 0 and 100",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate tax if provided
    if (tax !== undefined) {
      const taxAmount = parseFloat(tax);
      if (isNaN(taxAmount) || taxAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Tax must be a number >= 0",
            errors: [
              {
                field: "tax",
                message: "Tax must be a number >= 0",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate fees if provided
    if (fees !== undefined) {
      const feesAmount = parseFloat(fees);
      if (isNaN(feesAmount) || feesAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Fees must be a number >= 0",
            errors: [
              {
                field: "fees",
                message: "Fees must be a number >= 0",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate settlement method if provided
    if (settlementDetails?.method) {
      const validMethods = ["bank", "upi", "wallet", "other"];
      if (!validMethods.includes(settlementDetails.method)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid settlement method. Must be one of: ${validMethods.join(", ")}`,
            errors: [
              {
                field: "settlement.method",
                message: `Settlement method must be one of: ${validMethods.join(", ")}`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Create settlement
    const settlementData = {
      vendor: vendor || null,
      period: {
        startDate: startDate,
        endDate: endDate,
      },
      orders: orders || [],
      payments: payments || [],
      summary: {
        totalSales: 0,
        totalOrders: 0,
        totalRefunds: 0,
        totalCommission: 0,
        commissionRate: commissionRate !== undefined ? parseFloat(commissionRate) : 0,
        tax: tax !== undefined ? parseFloat(tax) : 0,
        fees: fees !== undefined ? parseFloat(fees) : 0,
        netAmount: 0,
      },
      status: "pending",
      settlement: {
        method: settlementDetails?.method || "bank",
        accountNumber: settlementDetails?.accountNumber || null,
        ifsc: settlementDetails?.ifsc || null,
        upi: settlementDetails?.upi || null,
        transactionId: null,
        processedAt: null,
        processedBy: null,
      },
      notes: notes ? notes.trim() : null,
    };

    const settlement = await Settlement.create(settlementData);

    // Calculate summary if orders are provided
    if (orders && orders.length > 0) {
      await settlement.calculateSummary();
    }

    // Populate related fields
    await settlement.populate("vendor", "firstname lastname email");
    await settlement.populate("orders", "orderNumber total status");
    await settlement.populate("settlement.processedBy", "firstname lastname email");

    // Format settlement
    const formattedSettlement = {
      id: settlement._id,
      vendor: settlement.vendor
        ? {
            id: settlement.vendor._id,
            name: `${settlement.vendor.firstname} ${settlement.vendor.lastname}`,
            email: settlement.vendor.email,
          }
        : null,
      period: {
        startDate: settlement.period.startDate,
        endDate: settlement.period.endDate,
      },
      summary: {
        totalSales: Math.round(settlement.summary.totalSales * 100) / 100,
        totalOrders: settlement.summary.totalOrders,
        totalRefunds: Math.round(settlement.summary.totalRefunds * 100) / 100,
        totalCommission: Math.round(settlement.summary.totalCommission * 100) / 100,
        commissionRate: settlement.summary.commissionRate,
        tax: Math.round(settlement.summary.tax * 100) / 100,
        fees: Math.round(settlement.summary.fees * 100) / 100,
        netAmount: Math.round(settlement.summary.netAmount * 100) / 100,
      },
      orders: settlement.orders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        total: Math.round(order.total * 100) / 100,
        status: order.status,
      })),
      payments: settlement.payments || [],
      status: settlement.status,
      settlement: {
        method: settlement.settlement.method,
        accountNumber: settlement.settlement.accountNumber || null,
        ifsc: settlement.settlement.ifsc || null,
        upi: settlement.settlement.upi || null,
        transactionId: settlement.settlement.transactionId || null,
        processedAt: settlement.settlement.processedAt || null,
        processedBy: settlement.settlement.processedBy || null,
      },
      notes: settlement.notes || null,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Settlement created successfully",
        data: {
          settlement: formattedSettlement,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create settlement. Please try again.",
      },
      { status: 500 }
    );
  }
}


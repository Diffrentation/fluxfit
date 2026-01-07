import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settlement from "@/models/settlement.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/finance/settlements/:id
 * Get settlement details
 */
export async function GET(request, { params }) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get settlement ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid settlement ID",
          errors: [{ field: "id", message: "Valid settlement ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get settlement
    const settlement = await Settlement.findById(id)
      .populate("vendor", "firstname lastname email phone")
      .populate("orders", "orderNumber total status createdAt items")
      .populate("settlement.processedBy", "firstname lastname email")
      .lean();

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          message: "Settlement not found",
        },
        { status: 404 }
      );
    }

    // Format orders
    const formattedOrders = settlement.orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      total: Math.round(order.total * 100) / 100,
      status: order.status,
      itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      createdAt: order.createdAt,
    }));

    // Format settlement
    const formattedSettlement = {
      id: settlement._id,
      vendor: settlement.vendor
        ? {
            id: settlement.vendor._id,
            name: `${settlement.vendor.firstname} ${settlement.vendor.lastname}`,
            email: settlement.vendor.email,
            phone: settlement.vendor.phone || null,
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
      orders: formattedOrders,
      orderCount: formattedOrders.length,
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
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Settlement details retrieved successfully",
        data: {
          settlement: formattedSettlement,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get settlement details error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve settlement details. Please try again.",
      },
      { status: 500 }
    );
  }
}


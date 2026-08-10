import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticateAdmin } from "@/lib/auth";
import CustomClothingOrder from "@/models/customClothingOrder.model";
import mongoose from "mongoose";

const VALID_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "in_production",
  "completed",
];

/**
 * GET /api/admin/custom-orders/[id]
 * Admin: fetch a single order detail
 */
export async function GET(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await CustomClothingOrder.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("user", "name email phone avatar")
      .populate("reviewedBy", "name email")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order._id.toString(),
          user: order.user
            ? {
                id: order.user._id.toString(),
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone || null,
                avatar: order.user.avatar || null,
              }
            : null,
          clothType: order.clothType,
          clothColor: order.clothColor,
          printPlacement: order.printPlacement,
          quantity: order.quantity,
          notes: order.notes,
          designImages: order.designImages,
          status: order.status,
          adminRemarks: order.adminRemarks,
          quote: order.quote || null,
          reviewedBy: order.reviewedBy
            ? { id: order.reviewedBy._id.toString(), name: order.reviewedBy.name }
            : null,
          reviewedAt: order.reviewedAt,
          estimatedDelivery: order.estimatedDelivery,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/custom-orders/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/custom-orders/[id]
 * Admin: update order status, remarks, estimated delivery
 */
export async function PATCH(request, { params }) {
  try {
    const { error, user: admin } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, adminRemarks, estimatedDelivery, quote } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    if (quote && quote.pricePerUnit != null) {
      const pricePerUnit = Number(quote.pricePerUnit);
      if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
        return NextResponse.json(
          { success: false, message: "Quoted price per unit must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    const order = await CustomClothingOrder.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (status) order.status = status;
    if (adminRemarks !== undefined) order.adminRemarks = adminRemarks;
    if (estimatedDelivery !== undefined) {
      order.estimatedDelivery = estimatedDelivery
        ? new Date(estimatedDelivery)
        : null;
    }
    if (quote && quote.pricePerUnit != null) {
      const pricePerUnit = Number(quote.pricePerUnit);
      order.quote = {
        pricePerUnit,
        totalAmount: Math.round(pricePerUnit * order.quantity * 100) / 100,
        currency: "INR",
        notes: quote.notes || "",
        quotedBy: admin._id,
        quotedAt: new Date(),
      };
    }

    // Record reviewer info when reviewing
    if (
      status &&
      (status === "approved" || status === "rejected") &&
      !order.reviewedBy
    ) {
      order.reviewedBy = admin._id;
      order.reviewedAt = new Date();
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: { status: order.status, quote: order.quote || null },
    });
  } catch (error) {
    console.error("PATCH /api/admin/custom-orders/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}

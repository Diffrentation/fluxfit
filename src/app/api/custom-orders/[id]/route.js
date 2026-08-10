import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticateUser } from "@/lib/auth";
import CustomClothingOrder from "@/models/customClothingOrder.model";
import mongoose from "mongoose";

/**
 * GET /api/custom-orders/[id]
 * Fetch a single custom clothing order (owner only)
 */
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateUser(request);
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
      user: user._id,
      isDeleted: false,
    }).lean();

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
          clothType: order.clothType,
          clothColor: order.clothColor,
          printPlacement: order.printPlacement,
          quantity: order.quantity,
          notes: order.notes,
          designImages: order.designImages,
          status: order.status,
          adminRemarks: order.adminRemarks,
          quote: order.quote || null,
          estimatedDelivery: order.estimatedDelivery,
          reviewedAt: order.reviewedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/custom-orders/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

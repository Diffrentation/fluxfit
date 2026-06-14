import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticateUser } from "@/lib/auth";
import CustomClothingOrder from "@/models/customClothingOrder.model";

/**
 * POST /api/custom-orders
 * Create a new custom clothing order
 */
export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const {
      clothType,
      clothColor,
      printPlacement,
      quantity,
      notes,
      designImages,
    } = body;

    // Validate required fields
    if (!clothType) {
      return NextResponse.json(
        { success: false, message: "Cloth type is required" },
        { status: 400 }
      );
    }
    if (!clothColor?.label || !clothColor?.hex) {
      return NextResponse.json(
        { success: false, message: "Cloth color is required" },
        { status: 400 }
      );
    }
    if (!printPlacement) {
      return NextResponse.json(
        { success: false, message: "Print placement is required" },
        { status: 400 }
      );
    }
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    // Ensure at least one design image is provided
    const imgs = designImages || {};
    const hasAtLeastOneImage =
      imgs.front || imgs.back || imgs.leftSleeve || imgs.rightSleeve;
    if (!hasAtLeastOneImage) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload at least one design image",
        },
        { status: 400 }
      );
    }

    const order = await CustomClothingOrder.create({
      user: user._id,
      clothType,
      clothColor,
      printPlacement,
      quantity: Number(quantity),
      notes: notes || "",
      designImages: {
        front: imgs.front || null,
        back: imgs.back || null,
        leftSleeve: imgs.leftSleeve || null,
        rightSleeve: imgs.rightSleeve || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Custom order submitted successfully! We'll review it soon.",
        data: { orderId: order._id.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/custom-orders:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/custom-orders
 * Fetch current user's custom clothing orders
 */
export async function GET(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    const filter = { user: user._id, isDeleted: false };

    const [orders, total] = await Promise.all([
      CustomClothingOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomClothingOrder.countDocuments(filter),
    ]);

    const formatted = orders.map((o) => ({
      id: o._id.toString(),
      clothType: o.clothType,
      clothColor: o.clothColor,
      printPlacement: o.printPlacement,
      quantity: o.quantity,
      notes: o.notes,
      designImages: o.designImages,
      status: o.status,
      adminRemarks: o.adminRemarks,
      estimatedDelivery: o.estimatedDelivery,
      reviewedAt: o.reviewedAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formatted,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/custom-orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

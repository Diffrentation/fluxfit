import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticateAdmin } from "@/lib/auth";
import CustomClothingOrder from "@/models/customClothingOrder.model";

/**
 * GET /api/admin/custom-orders
 * Admin: list all custom clothing orders with filters
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter = { isDeleted: false };
    if (status && status !== "all") filter.status = status;

    let query = CustomClothingOrder.find(filter)
      .populate("user", "name email phone avatar")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [orders, total] = await Promise.all([
      query.lean(),
      CustomClothingOrder.countDocuments(filter),
    ]);

    // Apply search filter client-side (by user name/email)
    let filtered = orders;
    if (search) {
      const s = search.toLowerCase();
      filtered = orders.filter(
        (o) =>
          o.user?.name?.toLowerCase().includes(s) ||
          o.user?.email?.toLowerCase().includes(s) ||
          o.clothType?.toLowerCase().includes(s)
      );
    }

    const formatted = filtered.map((o) => ({
      id: o._id.toString(),
      user: o.user
        ? {
            id: o.user._id.toString(),
            name: o.user.name,
            email: o.user.email,
            phone: o.user.phone || null,
            avatar: o.user.avatar || null,
          }
        : null,
      clothType: o.clothType,
      clothColor: o.clothColor,
      printPlacement: o.printPlacement,
      quantity: o.quantity,
      notes: o.notes,
      designImages: o.designImages,
      status: o.status,
      adminRemarks: o.adminRemarks,
      reviewedBy: o.reviewedBy
        ? { id: o.reviewedBy._id.toString(), name: o.reviewedBy.name }
        : null,
      reviewedAt: o.reviewedAt,
      estimatedDelivery: o.estimatedDelivery,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    // Status counts
    const counts = await CustomClothingOrder.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts = counts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        orders: formatted,
        statusCounts,
        pagination: {
          total: search ? filtered.length : total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/custom-orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

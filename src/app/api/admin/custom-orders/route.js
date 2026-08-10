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

    const match = { isDeleted: false };
    if (status && status !== "all") match.status = status;

    // Search (user name/email, cloth type) has to run as part of the Mongo
    // query itself — filtering after .skip().limit() would only search
    // within the current page and make `total` inconsistent with the real
    // match count. User docs are looked up via $lookup since search needs
    // to reach fields (firstname/lastname/email) that live on that
    // collection, not on the order itself.
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reviewedBy",
          foreignField: "_id",
          as: "reviewedBy",
        },
      },
      { $unwind: { path: "$reviewedBy", preserveNullAndEmptyArrays: true } },
    ];

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      pipeline.push({
        $match: {
          $or: [
            { "user.firstname": regex },
            { "user.lastname": regex },
            { "user.email": regex },
            { clothType: regex },
          ],
        },
      });
    }

    const [orders, totalResult, statusCountsResult] = await Promise.all([
      CustomClothingOrder.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      CustomClothingOrder.aggregate([...pipeline, { $count: "total" }]),
      CustomClothingOrder.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const total = totalResult[0]?.total || 0;

    const formatted = orders.map((o) => ({
      id: o._id.toString(),
      user: o.user
        ? {
            id: o.user._id.toString(),
            name: `${o.user.firstname || ""} ${o.user.lastname || ""}`.trim(),
            email: o.user.email,
            phone: o.user.phone || null,
            avatar: o.user.profileimage || null,
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
      quote: o.quote || null,
      reviewedBy: o.reviewedBy
        ? {
            id: o.reviewedBy._id.toString(),
            name: `${o.reviewedBy.firstname || ""} ${o.reviewedBy.lastname || ""}`.trim(),
          }
        : null,
      reviewedAt: o.reviewedAt,
      estimatedDelivery: o.estimatedDelivery,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    const statusCounts = statusCountsResult.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        orders: formatted,
        statusCounts,
        pagination: {
          total,
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

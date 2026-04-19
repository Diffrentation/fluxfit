import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import CustomClothingDesign from "@/models/customClothingDesign.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * PATCH /api/admin/custom-clothes-designs/:id
 * Body: { active?: boolean, name?: string, sortOrder?: number }
 */
export async function PATCH(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid design id." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const patch = {};
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (body.sortOrder !== undefined) {
      const n = Number(body.sortOrder);
      if (Number.isFinite(n)) patch.sortOrder = n;
    }

    if (!Object.keys(patch).length) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 }
      );
    }

    await connectDB();
    const doc = await CustomClothingDesign.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Design not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Updated.",
      data: {
        design: {
          id: doc._id.toString(),
          name: doc.name,
          active: doc.active,
          sortOrder: doc.sortOrder,
        },
      },
    });
  } catch (err) {
    console.error("PATCH custom-clothes-design:", err);
    return NextResponse.json(
      { success: false, message: "Update failed." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/custom-clothes-designs/:id
 */
export async function DELETE(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid design id." },
        { status: 400 }
      );
    }

    await connectDB();
    const doc = await CustomClothingDesign.findByIdAndDelete(id).lean();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Design not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Design removed." });
  } catch (err) {
    console.error("DELETE custom-clothes-design:", err);
    return NextResponse.json(
      { success: false, message: "Delete failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/models/contact.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/contacts/:id/resolve
 */
export async function PUT(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid contact id." },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await Contact.findByIdAndUpdate(
      id,
      { status: "resolved", resolvedAt: new Date() },
      { new: true }
    ).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Contact not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Marked as resolved.",
      data: { id: doc._id.toString(), status: doc.status },
    });
  } catch (err) {
    console.error("PUT /api/admin/contacts/[id]/resolve:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update status." },
      { status: 500 }
    );
  }
}

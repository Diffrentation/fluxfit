import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact, {
  CONTACT_STATUSES,
  migrateLegacyContactStatuses,
} from "@/models/contact.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/contacts/:id
 * Body: { status: "pending" | "approved" | "rejected" | "spam" }
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

    const body = await request.json().catch(() => ({}));
    const raw = body?.status;
    const status =
      typeof raw === "string" ? raw.trim().toLowerCase() : String(raw || "");

    if (!status || !CONTACT_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Use one of: ${CONTACT_STATUSES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    await connectDB();
    await migrateLegacyContactStatuses();

    const resolvedAt = status === "pending" ? null : new Date();

    const doc = await Contact.findByIdAndUpdate(
      id,
      { $set: { status, resolvedAt } },
      { new: true, lean: true, runValidators: false }
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Contact not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated.",
      data: {
        id: doc._id.toString(),
        status: doc.status,
        resolvedAt: doc.resolvedAt || null,
      },
    });
  } catch (err) {
    console.error("PUT /api/admin/contacts/[id]:", err);
    const msg =
      err?.name === "CastError"
        ? "Invalid contact id or data."
        : err?.message || "Failed to update status.";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/contacts/:id
 */
export async function DELETE(request, { params }) {
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

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Contact not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Query removed.",
    });
  } catch (err) {
    console.error("DELETE /api/admin/contacts/[id]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete." },
      { status: 500 }
    );
  }
}

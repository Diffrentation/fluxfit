import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/models/contact.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

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

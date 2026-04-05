import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact, { migrateLegacyContactStatuses } from "@/models/contact.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/contacts/pending-count — badge / dashboard
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();
    await migrateLegacyContactStatuses();
    const pending = await Contact.countDocuments({ status: "pending" });

    return NextResponse.json({
      success: true,
      data: { pending },
    });
  } catch (err) {
    console.error("GET /api/admin/contacts/pending-count:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load count." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact, {
  CONTACT_STATUSES,
  migrateLegacyContactStatuses,
} from "@/models/contact.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/contacts
 * Query: page, limit, status (pending|approved|rejected|spam|omit for all)
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();
    await migrateLegacyContactStatuses();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit"), 10) || 20));
    const status = searchParams.get("status");

    const query = {};
    if (status && CONTACT_STATUSES.includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(query),
    ]);

    const contacts = items.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      subject: c.subject,
      message: c.message,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      resolvedAt: c.resolvedAt || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/admin/contacts:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load contact queries." },
      { status: 500 }
    );
  }
}

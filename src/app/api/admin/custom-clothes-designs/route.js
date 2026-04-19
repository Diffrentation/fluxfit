import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CustomClothingDesign from "@/models/customClothingDesign.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/custom-clothes-designs
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();
    const rows = await CustomClothingDesign.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const designs = rows.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description || "",
      imageUrl: d.imageUrl,
      active: Boolean(d.active),
      sortOrder: d.sortOrder ?? 0,
      kind: d.kind || "upload",
      seedKey: d.seedKey || null,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ success: true, data: { designs } });
  } catch (err) {
    console.error("GET /api/admin/custom-clothes-designs:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load designs." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/custom-clothes-designs
 * Body: { name, imageUrl, description? }
 */
export async function POST(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    const description = String(body.description || "").trim();

    if (!name || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Name and imageUrl are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const maxOrder = await CustomClothingDesign.findOne()
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;

    const doc = await CustomClothingDesign.create({
      name,
      imageUrl,
      description,
      active: true,
      sortOrder,
      kind: "upload",
    });

    return NextResponse.json({
      success: true,
      message: "Design added.",
      data: {
        design: {
          id: doc._id.toString(),
          name: doc.name,
          description: doc.description,
          imageUrl: doc.imageUrl,
          active: doc.active,
          sortOrder: doc.sortOrder,
          kind: doc.kind,
        },
      },
    });
  } catch (err) {
    console.error("POST /api/admin/custom-clothes-designs:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to save design." },
      { status: 500 }
    );
  }
}

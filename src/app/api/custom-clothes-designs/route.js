import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CustomClothingDesign from "@/models/customClothingDesign.model";

/**
 * GET /api/custom-clothes-designs
 * Public: active designs for the Custom Clothes flow only.
 */
export async function GET() {
  try {
    await connectDB();
    const rows = await CustomClothingDesign.find({ active: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const designs = rows.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description || "",
      imageUrl: d.imageUrl,
    }));

    return NextResponse.json({ success: true, data: { designs } });
  } catch (err) {
    console.error("GET /api/custom-clothes-designs:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load designs.", data: { designs: [] } },
      { status: 500 }
    );
  }
}

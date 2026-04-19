import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CustomClothingDesign from "@/models/customClothingDesign.model";
import { authenticateAdmin } from "@/lib/auth";
import { CUSTOM_CLOTHING_DESIGN_SEEDS } from "@/lib/customClothingDesignSeeds";

/**
 * POST /api/admin/custom-clothes-designs/seed
 * Upserts the 10 bundled animation characters (idempotent).
 */
export async function POST(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const row of CUSTOM_CLOTHING_DESIGN_SEEDS) {
      const existing = await CustomClothingDesign.findOne({
        seedKey: row.seedKey,
      }).lean();
      if (existing) {
        skipped += 1;
        continue;
      }
      await CustomClothingDesign.create({
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        active: true,
        sortOrder: row.sortOrder,
        seedKey: row.seedKey,
        kind: "seed",
      });
      created += 1;
    }

    return NextResponse.json({
      success: true,
      message:
        created > 0
          ? `Added ${created} character design(s). ${skipped} already existed.`
          : "All 10 demo characters are already in the catalog.",
      data: { created, skipped, total: CUSTOM_CLOTHING_DESIGN_SEEDS.length },
    });
  } catch (err) {
    console.error("POST seed custom-clothes-designs:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Seed failed." },
      { status: 500 }
    );
  }
}

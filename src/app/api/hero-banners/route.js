import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/herobanner.model";

/**
 * GET /api/hero-banners
 * Public - returns all active hero banner slides ordered by `order` field
 */
export async function GET() {
  try {
    await connectDB();

    const banners = await HeroBanner.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: { banners },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get hero banners error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve hero banners." },
      { status: 500 }
    );
  }
}

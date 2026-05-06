import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/herobanner.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

const KNOWN_IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

function isLikelyImageUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value.trim());
    const pathname = parsed.pathname.toLowerCase();
    const hasImageExt = /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i.test(pathname);
    return hasImageExt || KNOWN_IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/hero-banners/[id]
 */
export async function GET(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid hero banner id." },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findById(id).lean();
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Hero banner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { banner } }, { status: 200 });
  } catch (error) {
    console.error("Admin get hero banner error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve hero banner." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/hero-banners/[id]
 * Update a hero banner slide
 */
export async function PUT(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid hero banner id." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowed = [
      "title", "subtitle", "description", "buttonText", "buttonLink",
      "image", "badge", "discountText", "originalPrice", "salePrice",
      "bgColor", "isActive", "order",
    ];

    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.prototype.hasOwnProperty.call(updates, "image") && !isLikelyImageUrl(updates.image)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid direct image URL.",
        },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Hero banner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Hero banner updated successfully.", data: { banner } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update hero banner error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update hero banner." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/hero-banners/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid hero banner id." },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findByIdAndDelete(id).lean();
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Hero banner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Hero banner deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete hero banner error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete hero banner." },
      { status: 500 }
    );
  }
}

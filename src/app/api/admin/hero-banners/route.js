import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/herobanner.model";
import { authenticateAdmin } from "@/lib/auth";

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
 * GET /api/admin/hero-banners
 * Admin - get all hero banner slides (active + inactive)
 */
export async function GET(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const banners = await HeroBanner.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json(
      { success: true, data: { banners } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get hero banners error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve hero banners." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/hero-banners
 * Admin - create a new hero banner slide
 *
 * Body:
 *   title, subtitle, description, buttonText, buttonLink,
 *   image, badge, discountText, originalPrice, salePrice,
 *   bgColor, isActive, order
 */
export async function POST(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();

    const {
      title,
      subtitle = "",
      description = "",
      buttonText = "SHOP NOW",
      buttonLink = "/product-list",
      image,
      badge = "",
      discountText = "",
      originalPrice = null,
      salePrice = null,
      bgColor = "",
      isActive = true,
      order,
    } = body;

    if (!title || !image) {
      return NextResponse.json(
        { success: false, message: "Title and image are required." },
        { status: 400 }
      );
    }

    if (!isLikelyImageUrl(image)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid direct image URL.",
        },
        { status: 400 }
      );
    }

    // Auto-assign order if not provided
    let slideOrder = order;
    if (slideOrder === undefined || slideOrder === null) {
      const last = await HeroBanner.findOne({}).sort({ order: -1 }).lean();
      slideOrder = last ? last.order + 1 : 0;
    }

    const banner = await HeroBanner.create({
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      image,
      badge,
      discountText,
      originalPrice,
      salePrice,
      bgColor,
      isActive,
      order: slideOrder,
    });

    return NextResponse.json(
      { success: true, message: "Hero banner created successfully.", data: { banner } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create hero banner error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create hero banner." },
      { status: 500 }
    );
  }
}

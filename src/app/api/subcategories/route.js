import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Category from "@/models/category.model";

/**
 * GET /api/subcategories?categoryId=<id>
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "categoryId query parameter is required",
        },
        { status: 400 }
      );
    }

    let parentFilter = null;
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      parentFilter = new mongoose.Types.ObjectId(categoryId);
    } else {
      const parentBySlug = await Category.findOne({
        slug: categoryId,
        isDeleted: false,
      }).select("_id");
      if (!parentBySlug) {
        return NextResponse.json(
          {
            success: true,
            message: "No subcategories found",
            data: { subcategories: [] },
          },
          { status: 200 }
        );
      }
      parentFilter = parentBySlug._id;
    }

    const subcategories = await Category.find({
      parent: parentFilter,
      isDeleted: false,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Subcategories retrieved successfully",
        data: {
          subcategories: subcategories.map((cat) => ({
            id: cat._id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || null,
            parent: cat.parent || null,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get subcategories error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve subcategories",
      },
      { status: 500 }
    );
  }
}

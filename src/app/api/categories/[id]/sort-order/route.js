import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category.model";
import mongoose from "mongoose";

/**
 * PUT /api/categories/:id/sort-order
 * Update category sort order (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get category ID or slug from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID or slug is required",
          errors: [
            {
              field: "id",
              message: "Category ID or slug is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find category
    const category = await Category.findOne(query);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sortOrder } = body;

    // Validate sortOrder
    if (sortOrder === undefined || sortOrder === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order is required",
          errors: [
            {
              field: "sortOrder",
              message: "Sort order is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (isNaN(sortOrder)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a number",
          errors: [
            {
              field: "sortOrder",
              message: "Sort order must be a valid number",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update sort order
    const previousSortOrder = category.sortOrder;
    category.sortOrder = parseInt(sortOrder);
    await category.save();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Category sort order updated successfully",
        data: {
          category: {
            id: category._id,
            name: category.name,
            slug: category.slug,
            previousSortOrder: previousSortOrder,
            sortOrder: category.sortOrder,
            updatedAt: category.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update category sort order error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update category sort order. Please try again.",
      },
      { status: 500 }
    );
  }
}

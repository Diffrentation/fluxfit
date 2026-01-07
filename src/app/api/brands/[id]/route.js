import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Brand from "@/models/brand.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/brands/:id
 * Get brand by ID or slug
 *
 * Query Parameters:
 * - includeProductCount: Include product count (default: false)
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get brand ID or slug from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID or slug is required",
          errors: [
            {
              field: "id",
              message: "Brand ID or slug is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeProductCount =
      searchParams.get("includeProductCount") === "true";

    // Build query - try as ObjectId first, then as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find brand
    const brand = await Brand.findOne(query).lean();

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
        },
        { status: 404 }
      );
    }

    // Format brand
    const formattedBrand = {
      id: brand._id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description || null,
      logo: brand.logo || null,
      banner: brand.banner || null,
      website: brand.website || null,
      sortOrder: brand.sortOrder || 0,
      isActive: brand.isActive,
      isFeatured: brand.isFeatured || false,
      metaTitle: brand.metaTitle || null,
      metaDescription: brand.metaDescription || null,
      metaKeywords: brand.metaKeywords || [],
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };

    // Include product count if requested
    if (includeProductCount) {
      const productCount = await Product.countDocuments({
        brand: brand._id,
        isDeleted: false,
        status: "active",
      });

      formattedBrand.productCount = productCount;
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Brand retrieved successfully",
        data: {
          brand: formattedBrand,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get brand error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve brand. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brands/:id
 * Update brand (Admin only)
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

    // Get brand ID or slug from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID or slug is required",
          errors: [
            {
              field: "id",
              message: "Brand ID or slug is required",
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

    // Find brand
    const brand = await Brand.findOne(query);

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      slug,
      description,
      logo,
      banner,
      website,
      sortOrder,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = body;

    // Build update object with only provided fields
    const updateData = {};
    const errors = [];

    // Name
    if (name !== undefined) {
      if (!name || !name.trim()) {
        errors.push({
          field: "name",
          message: "Brand name cannot be empty",
        });
      } else {
        updateData.name = name.trim();
      }
    }

    // Slug
    if (slug !== undefined) {
      if (!slug || !slug.trim()) {
        errors.push({
          field: "slug",
          message: "Brand slug cannot be empty",
        });
      } else {
        const slugValue = slug.toLowerCase().trim();
        // Check if slug is already taken by another brand
        const existingSlug = await Brand.findOne({
          slug: slugValue,
          _id: { $ne: brand._id },
          isDeleted: false,
        });

        if (existingSlug) {
          errors.push({
            field: "slug",
            message: "Brand with this slug already exists",
          });
        } else {
          updateData.slug = slugValue;
        }
      }
    }

    // Description
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    // Logo
    if (logo !== undefined) {
      updateData.logo = logo ? logo.trim() : null;
    }

    // Banner
    if (banner !== undefined) {
      updateData.banner = banner ? banner.trim() : null;
    }

    // Website
    if (website !== undefined) {
      if (website && website.trim()) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(website.trim())) {
          errors.push({
            field: "website",
            message: "Website must be a valid URL (http:// or https://)",
          });
        } else {
          updateData.website = website.trim();
        }
      } else {
        updateData.website = null;
      }
    }

    // Sort order
    if (sortOrder !== undefined) {
      updateData.sortOrder = parseInt(sortOrder) || 0;
    }

    // Is active
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === "true";
    }

    // Is featured
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured === true || isFeatured === "true";
    }

    // Meta title
    if (metaTitle !== undefined) {
      updateData.metaTitle = metaTitle ? metaTitle.trim() : null;
    }

    // Meta description
    if (metaDescription !== undefined) {
      if (metaDescription && metaDescription.length > 160) {
        errors.push({
          field: "metaDescription",
          message: "Meta description must be 160 characters or less",
        });
      } else {
        updateData.metaDescription = metaDescription
          ? metaDescription.trim()
          : null;
      }
    }

    // Meta keywords
    if (metaKeywords !== undefined) {
      updateData.metaKeywords = metaKeywords
        ? metaKeywords
            .map((keyword) => keyword.trim().toLowerCase())
            .filter((keyword) => keyword.length > 0)
        : [];
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided to update",
          errors: [
            {
              field: "body",
              message: "Please provide at least one field to update",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update brand
    Object.assign(brand, updateData);
    await brand.save();

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Brand updated successfully",
        data: {
          brand: {
            id: brand._id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description || null,
            logo: brand.logo || null,
            banner: brand.banner || null,
            website: brand.website || null,
            sortOrder: brand.sortOrder || 0,
            isActive: brand.isActive,
            isFeatured: brand.isFeatured || false,
            metaTitle: brand.metaTitle || null,
            metaDescription: brand.metaDescription || null,
            metaKeywords: brand.metaKeywords || [],
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update brand error:", error);

    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          message: `Brand with this ${field} already exists`,
          errors: [
            {
              field: field,
              message: `A brand with this ${field} already exists`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update brand. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brands/:id
 * Delete brand (Admin only) - Soft delete
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get brand ID or slug from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID or slug is required",
          errors: [
            {
              field: "id",
              message: "Brand ID or slug is required",
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

    // Find brand
    const brand = await Brand.findOne(query);

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
        },
        { status: 404 }
      );
    }

    // Check if brand has products
    const productCount = await Product.countDocuments({
      brand: brand._id,
      isDeleted: false,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete brand with associated products",
          errors: [
            {
              field: "brand",
              message: `This brand has ${productCount} product${
                productCount === 1 ? "" : "s"
              }. Please remove or reassign products first.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Soft delete brand
    brand.isDeleted = true;
    brand.deletedAt = new Date();
    await brand.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Brand deleted successfully",
        data: {
          message: "Brand has been deleted successfully",
          brandId: brand._id,
          brandName: brand.name,
          deletedAt: brand.deletedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete brand. Please try again.",
      },
      { status: 500 }
    );
  }
}

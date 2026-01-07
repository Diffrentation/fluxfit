import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/categories/:id
 * Get category by ID or slug
 *
 * Query Parameters:
 * - includeProductCount: Include product count (default: false)
 * - includeChildren: Include children categories (default: false)
 * - includeParent: Include parent category (default: false)
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get category ID or slug from params
    const { id } = params;

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeProductCount =
      searchParams.get("includeProductCount") === "true";
    const includeChildren = searchParams.get("includeChildren") === "true";
    const includeParent = searchParams.get("includeParent") === "true";

    // Build query - try as ObjectId first, then as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find category
    const category = await Category.findOne(query).lean();

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // Format category
    const formattedCategory = {
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      parent: category.parent || null,
      image: category.image || null,
      banner: category.banner || null,
      icon: category.icon || null,
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
      isFeatured: category.isFeatured || false,
      metaTitle: category.metaTitle || null,
      metaDescription: category.metaDescription || null,
      metaKeywords: category.metaKeywords || [],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    // Include parent category if requested
    if (includeParent && category.parent) {
      const parent = await Category.findById(category.parent)
        .select("name slug description image icon")
        .lean();

      if (parent) {
        formattedCategory.parent = {
          id: parent._id,
          name: parent.name,
          slug: parent.slug,
          description: parent.description || null,
          image: parent.image || null,
          icon: parent.icon || null,
        };
      }
    }

    // Include children categories if requested
    if (includeChildren) {
      const children = await Category.find({
        parent: category._id,
        isDeleted: false,
        isActive: true,
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      formattedCategory.children = children.map((child) => ({
        id: child._id,
        name: child.name,
        slug: child.slug,
        description: child.description || null,
        image: child.image || null,
        icon: child.icon || null,
        sortOrder: child.sortOrder || 0,
        isActive: child.isActive,
        isFeatured: child.isFeatured || false,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      }));
    }

    // Include product count if requested
    if (includeProductCount) {
      const productCount = await Product.countDocuments({
        category: category._id,
        isDeleted: false,
        status: "active",
      });

      formattedCategory.productCount = productCount;

      // If children are included, add their product counts too
      if (includeChildren && formattedCategory.children) {
        const childrenIds = formattedCategory.children.map((c) => c.id);
        if (childrenIds.length > 0) {
          const childrenProductCounts = await Product.aggregate([
            {
              $match: {
                category: { $in: childrenIds },
                isDeleted: false,
                status: "active",
              },
            },
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
          ]);

          const countMap = new Map();
          childrenProductCounts.forEach((item) => {
            countMap.set(item._id.toString(), item.count);
          });

          formattedCategory.children = formattedCategory.children.map(
            (child) => ({
              ...child,
              productCount: countMap.get(child.id.toString()) || 0,
            })
          );
        }
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Category retrieved successfully",
        data: {
          category: formattedCategory,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve category. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/:id
 * Update category (Admin only)
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
    const { id } = params;

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
    const {
      name,
      slug,
      description,
      parent,
      image,
      banner,
      icon,
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
          message: "Category name cannot be empty",
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
          message: "Category slug cannot be empty",
        });
      } else {
        const slugValue = slug.toLowerCase().trim();
        // Check if slug is already taken by another category
        const existingSlug = await Category.findOne({
          slug: slugValue,
          _id: { $ne: category._id },
          isDeleted: false,
        });

        if (existingSlug) {
          errors.push({
            field: "slug",
            message: "Category with this slug already exists",
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

    // Parent
    if (parent !== undefined) {
      if (parent === null || parent === "") {
        updateData.parent = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
          errors.push({
            field: "parent",
            message: "Invalid parent category ID format",
          });
        } else {
          // Check if parent category exists and is not deleted
          const parentCategory = await Category.findOne({
            _id: parent,
            isDeleted: false,
          });

          if (!parentCategory) {
            errors.push({
              field: "parent",
              message: "Parent category not found or has been deleted",
            });
          } else {
            // Prevent self-reference
            if (parent.toString() === category._id.toString()) {
              errors.push({
                field: "parent",
                message: "Category cannot be its own parent",
              });
            } else {
              // Prevent circular reference - check if parent is a descendant
              const checkCircular = async (parentId, currentId) => {
                if (!parentId) return false;
                const parentCat = await Category.findById(parentId);
                if (!parentCat || !parentCat.parent) return false;
                if (parentCat.parent.toString() === currentId.toString())
                  return true;
                return checkCircular(parentCat.parent, currentId);
              };

              const hasCircular = await checkCircular(parent, category._id);
              if (hasCircular) {
                errors.push({
                  field: "parent",
                  message: "Cannot set parent: would create circular reference",
                });
              } else {
                updateData.parent = parent;
              }
            }
          }
        }
      }
    }

    // Image
    if (image !== undefined) {
      updateData.image = image ? image.trim() : null;
    }

    // Banner
    if (banner !== undefined) {
      updateData.banner = banner ? banner.trim() : null;
    }

    // Icon
    if (icon !== undefined) {
      updateData.icon = icon ? icon.trim() : null;
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

    // Update category
    Object.assign(category, updateData);
    await category.save();

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        data: {
          category: {
            id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description || null,
            parent: category.parent || null,
            image: category.image || null,
            banner: category.banner || null,
            icon: category.icon || null,
            sortOrder: category.sortOrder || 0,
            isActive: category.isActive,
            isFeatured: category.isFeatured || false,
            metaTitle: category.metaTitle || null,
            metaDescription: category.metaDescription || null,
            metaKeywords: category.metaKeywords || [],
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update category error:", error);

    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          message: `Category with this ${field} already exists`,
          errors: [
            {
              field: field,
              message: `A category with this ${field} already exists`,
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
        message:
          error.message || "Failed to update category. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/:id
 * Delete category (Admin only) - Soft delete
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

    // Get category ID or slug from params
    const { id } = params;

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

    // Check if category has children
    const childrenCount = await Category.countDocuments({
      parent: category._id,
      isDeleted: false,
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete category with child categories",
          errors: [
            {
              field: "category",
              message: `This category has ${childrenCount} child categor${
                childrenCount === 1 ? "y" : "ies"
              }. Please delete or move them first.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: category._id,
      isDeleted: false,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete category with associated products",
          errors: [
            {
              field: "category",
              message: `This category has ${productCount} product${
                productCount === 1 ? "" : "s"
              }. Please remove or reassign products first.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Soft delete category
    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
        data: {
          message: "Category has been deleted successfully",
          categoryId: category._id,
          categoryName: category.name,
          deletedAt: category.deletedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to delete category. Please try again.",
      },
      { status: 500 }
    );
  }
}

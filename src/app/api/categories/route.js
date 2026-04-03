import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/categories
 * Get all categories (tree structure)
 * 
 * Query Parameters:
 * - format: Response format - "tree" (default) or "flat"
 * - includeInactive: Include inactive categories (default: false)
 * - includeProductCount: Include product count for each category (default: false)
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "tree";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const includeProductCount = searchParams.get("includeProductCount") === "true";

    let categories;

    if (format === "tree") {
      // Get categories in tree structure
      if (includeInactive) {
        // Get all categories (including inactive) and build tree manually
        const allCategories = await Category.find({
          isDeleted: false,
        })
          .sort({ sortOrder: 1, name: 1 })
          .lean();

        // Build tree structure
        const buildTree = (parentId = null) => {
          return allCategories
            .filter((cat) => {
              if (parentId === null) return !cat.parent;
              return cat.parent && cat.parent.toString() === parentId.toString();
            })
            .map((cat) => ({
              id: cat._id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              parent: cat.parent || null,
              image: cat.image || null,
              banner: cat.banner || null,
              icon: cat.icon || null,
              sortOrder: cat.sortOrder || 0,
              isActive: cat.isActive,
              isFeatured: cat.isFeatured || false,
              metaTitle: cat.metaTitle || null,
              metaDescription: cat.metaDescription || null,
              metaKeywords: cat.metaKeywords || [],
              createdAt: cat.createdAt,
              updatedAt: cat.updatedAt,
              children: buildTree(cat._id),
            }));
        };

        categories = buildTree();
      } else {
        // Use the model's getTree method (only active categories)
        const treeData = await Category.getTree();
        categories = treeData.map((cat) => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          parent: cat.parent || null,
          image: cat.image || null,
          banner: cat.banner || null,
          icon: cat.icon || null,
          sortOrder: cat.sortOrder || 0,
          isActive: cat.isActive,
          isFeatured: cat.isFeatured || false,
          metaTitle: cat.metaTitle || null,
          metaDescription: cat.metaDescription || null,
          metaKeywords: cat.metaKeywords || [],
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          children: cat.children || [],
        }));
      }
    } else {
      // Get flat list
      const query = { isDeleted: false };
      if (!includeInactive) {
        query.isActive = true;
      }

      const flatCategories = await Category.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      categories = flatCategories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        parent: cat.parent || null,
        image: cat.image || null,
        banner: cat.banner || null,
        icon: cat.icon || null,
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive,
        isFeatured: cat.isFeatured || false,
        metaTitle: cat.metaTitle || null,
        metaDescription: cat.metaDescription || null,
        metaKeywords: cat.metaKeywords || [],
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      }));
    }

    // Add product counts if requested
    if (includeProductCount) {
      const categoryIds = categories.map((cat) => cat.id);
      
      // Get product counts for all categories
      const productCounts = await Product.aggregate([
        {
          $match: {
            category: { $in: categoryIds },
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
      productCounts.forEach((item) => {
        countMap.set(item._id.toString(), item.count);
      });

      // Recursively add product counts
      const addProductCounts = (cats) => {
        return cats.map((cat) => {
          const count = countMap.get(cat.id.toString()) || 0;
          const result = {
            ...cat,
            productCount: count,
          };

          if (cat.children && Array.isArray(cat.children)) {
            result.children = addProductCounts(cat.children);
            // Add children counts to parent
            const childrenCount = result.children.reduce(
              (sum, child) => sum + (child.productCount || 0),
              0
            );
            result.productCount = count + childrenCount;
          }

          return result;
        });
      };

      categories = addProductCounts(categories);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Categories retrieved successfully",
        data: {
          categories,
          format,
          count: format === "tree" 
            ? categories.length 
            : categories.length,
          totalCategories: categories.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve categories. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create category (Admin only)
 */
export async function POST(request) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const {
      name,
      slug,
      description,
      parent: parentRaw,
      parentId,
      image,
      banner,
      icon,
      sortOrder,
      isActive = true,
      isFeatured = false,
      metaTitle,
      metaDescription,
      metaKeywords: metaKeywordsRaw,
    } = body;

    const parentCandidate =
      parentRaw !== undefined && parentRaw !== null ? parentRaw : parentId;
    const parent =
      parentCandidate === "" || parentCandidate === undefined
        ? null
        : parentCandidate;

    const trimUrl = (value) => {
      if (value == null) return null;
      if (typeof value === "string") {
        const t = value.trim();
        return t.length ? t : null;
      }
      return null;
    };

    const normalizeMetaKeywords = (mk) => {
      if (mk == null || mk === "") return [];
      if (Array.isArray(mk)) {
        return mk
          .map((k) => String(k).trim().toLowerCase())
          .filter((k) => k.length > 0);
      }
      if (typeof mk === "string") {
        return mk
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0);
      }
      return [];
    };

    const metaKeywords = normalizeMetaKeywords(metaKeywordsRaw);

    // Validate required fields
    const errors = [];

    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Category name is required",
      });
    }

    // Validate parent if provided
    if (parent) {
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
          // Prevent circular reference - check if parent is trying to be a child of this category
          // (This check is more relevant for updates, but we'll include it here too)
          const checkCircular = async (parentId, currentId = null) => {
            if (!parentId) return false;
            const parentCat = await Category.findById(parentId);
            if (!parentCat || !parentCat.parent) return false;
            if (parentCat.parent.toString() === currentId?.toString()) return true;
            return checkCircular(parentCat.parent, currentId);
          };

          // For new categories, we can't have circular refs yet, but we check if parent's parent chain is valid
          if (parentCategory.parent) {
            // Check if parent's parent chain would create issues
            const hasCircular = await checkCircular(parentCategory.parent);
            if (hasCircular) {
              errors.push({
                field: "parent",
                message: "Cannot set parent: would create circular reference",
              });
            }
          }
        }
      }
    }

    // Validate slug if provided
    if (slug) {
      const existingSlug = await Category.findOne({
        slug: slug.toLowerCase().trim(),
        isDeleted: false,
      });

      if (existingSlug) {
        errors.push({
          field: "slug",
          message: "Category with this slug already exists",
        });
      }
    }

    // Validate metaDescription length
    if (metaDescription && metaDescription.length > 160) {
      errors.push({
        field: "metaDescription",
        message: "Meta description must be 160 characters or less",
      });
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

    // Build category data
    const categoryData = {
      name: name.trim(),
      description: description?.trim() || null,
      parent,
      image: trimUrl(image),
      banner: trimUrl(banner),
      icon: trimUrl(icon),
      sortOrder: sortOrder || 0,
      isActive: isActive === true || isActive === "true",
      isFeatured: isFeatured === true || isFeatured === "true",
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      metaKeywords,
    };

    // Set slug (will be auto-generated by pre-save hook if not provided)
    if (slug) {
      categoryData.slug = slug.toLowerCase().trim();
    }

    // Create category
    const newCategory = new Category(categoryData);
    await newCategory.save();

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: {
          category: {
            id: newCategory._id,
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description || null,
            parent: newCategory.parent || null,
            image: newCategory.image || null,
            banner: newCategory.banner || null,
            icon: newCategory.icon || null,
            sortOrder: newCategory.sortOrder || 0,
            isActive: newCategory.isActive,
            isFeatured: newCategory.isFeatured || false,
            metaTitle: newCategory.metaTitle || null,
            metaDescription: newCategory.metaDescription || null,
            metaKeywords: newCategory.metaKeywords || [],
            createdAt: newCategory.createdAt,
            updatedAt: newCategory.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);

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
          error.message || "Failed to create category. Please try again.",
      },
      { status: 500 }
    );
  }
}


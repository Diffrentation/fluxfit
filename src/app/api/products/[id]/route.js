import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/products/:id
 * Get product by ID or slug
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get product ID or slug from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID or slug is required",
          errors: [
            {
              field: "id",
              message: "Product ID or slug is required",
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

    // Find product with populated fields
    const product = await Product.findOne(query)
      .populate("category", "name slug description")
      .populate("brand", "name logo description")
      .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Check if product is active (only return active products to public)
    // You might want to allow viewing inactive products for admins
    if (product.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Product is not available",
        },
        { status: 404 }
      );
    }

    // Get primary image
    const primaryImage =
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      null;

    // Calculate discount percentage
    const discountPercentage =
      product.originalPrice && product.originalPrice > product.basePrice
        ? Math.round(
            ((product.originalPrice - product.basePrice) /
              product.originalPrice) *
              100
          )
        : product.discount || 0;

    // Get available variants (only active ones)
    const availableVariants = (product.variants || []).filter(
      (variant) => variant.isActive && variant.stock > 0
    );

    // Format product for response
    const formattedProduct = {
      id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category
        ? {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
          }
        : null,
      brand: product.brand
        ? {
            id: product.brand._id,
            name: product.brand.name,
            logo: product.brand.logo,
            description: product.brand.description,
          }
        : null,
      basePrice: product.basePrice,
      originalPrice: product.originalPrice,
      discount: discountPercentage,
      images: product.images || [],
      primaryImage: primaryImage,
      variants: availableVariants,
      allVariants: product.variants || [], // Include all variants for admin purposes
      tags: product.tags || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock,
      inStock: product.inStock,
      rating: product.rating || { average: 0, count: 0 },
      reviews: product.reviews || 0,
      features: product.features || [],
      shipping: product.shipping,
      returnPolicy: product.returnPolicy,
      isFeatured: product.isFeatured || false,
      isNew: product.isNew || false,
      isPopular: product.isPopular || false,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Product retrieved successfully",
        data: {
          product: formattedProduct,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve product. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/:id
 * Update product (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Get product ID from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
          errors: [
            {
              field: "id",
              message: "Product ID is required",
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

    // Find product
    const product = await Product.findOne(query);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      shortDescription,
      category,
      brand,
      basePrice,
      originalPrice,
      discount,
      images,
      variants,
      tags,
      colors,
      sizes,
      stock,
      inStock,
      features,
      shipping,
      returnPolicy,
      metaTitle,
      metaDescription,
      metaKeywords,
      status,
      isFeatured,
      isNew,
      isPopular,
      slug,
    } = body;

    // Build update object with only provided fields
    const updateData = {};
    const errors = [];

    // Name
    if (name !== undefined) {
      if (!name || !name.trim()) {
        errors.push({
          field: "name",
          message: "Product name cannot be empty",
        });
      } else {
        updateData.name = name.trim();
      }
    }

    // Description
    if (description !== undefined) {
      if (!description || !description.trim()) {
        errors.push({
          field: "description",
          message: "Product description cannot be empty",
        });
      } else {
        updateData.description = description.trim();
      }
    }

    // Short description
    if (shortDescription !== undefined) {
      if (shortDescription && shortDescription.length > 200) {
        errors.push({
          field: "shortDescription",
          message: "Short description must be 200 characters or less",
        });
      } else {
        updateData.shortDescription = shortDescription?.trim() || "";
      }
    }

    // Category
    if (category !== undefined) {
      if (!category) {
        errors.push({
          field: "category",
          message: "Category cannot be empty",
        });
      } else if (!mongoose.Types.ObjectId.isValid(category)) {
        errors.push({
          field: "category",
          message: "Invalid category ID",
        });
      } else {
        updateData.category = category;
      }
    }

    // Brand
    if (brand !== undefined) {
      if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
        errors.push({
          field: "brand",
          message: "Invalid brand ID",
        });
      } else {
        updateData.brand = brand || null;
      }
    }

    // Base price
    if (basePrice !== undefined) {
      if (basePrice === null || basePrice < 0) {
        errors.push({
          field: "basePrice",
          message: "Base price must be greater than or equal to 0",
        });
      } else {
        updateData.basePrice = parseFloat(basePrice);
      }
    }

    // Original price
    if (originalPrice !== undefined) {
      if (originalPrice !== null && originalPrice < 0) {
        errors.push({
          field: "originalPrice",
          message: "Original price must be greater than or equal to 0",
        });
      } else {
        updateData.originalPrice = originalPrice
          ? parseFloat(originalPrice)
          : null;
      }
    }

    // Discount
    if (discount !== undefined) {
      if (discount < 0 || discount > 100) {
        errors.push({
          field: "discount",
          message: "Discount must be between 0 and 100",
        });
      } else {
        updateData.discount = parseFloat(discount);
      }
    }

    // Slug
    if (slug !== undefined) {
      if (!slug || !slug.trim()) {
        errors.push({
          field: "slug",
          message: "Slug cannot be empty",
        });
      } else {
        const newSlug = slug.toLowerCase().trim();
        // Check if slug already exists for another product
        const existingProduct = await Product.findOne({
          slug: newSlug,
          _id: { $ne: product._id },
          isDeleted: false,
        });
        if (existingProduct) {
          errors.push({
            field: "slug",
            message: "A product with this slug already exists",
          });
        } else {
          updateData.slug = newSlug;
        }
      }
    }

    // Images
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        errors.push({
          field: "images",
          message: "Images must be an array",
        });
      } else {
        images.forEach((img, index) => {
          if (!img.url || !img.url.trim()) {
            errors.push({
              field: `images[${index}].url`,
              message: "Image URL is required",
            });
          }
        });
        if (errors.filter((e) => e.field.startsWith("images[")).length === 0) {
          updateData.images = images;
        }
      }
    }

    // Variants
    if (variants !== undefined) {
      if (!Array.isArray(variants)) {
        errors.push({
          field: "variants",
          message: "Variants must be an array",
        });
      } else {
        variants.forEach((variant, index) => {
          if (!variant.size || !variant.size.trim()) {
            errors.push({
              field: `variants[${index}].size`,
              message: "Variant size is required",
            });
          }
          if (!variant.color || !variant.color.trim()) {
            errors.push({
              field: `variants[${index}].color`,
              message: "Variant color is required",
            });
          }
          if (variant.price === undefined || variant.price === null) {
            errors.push({
              field: `variants[${index}].price`,
              message: "Variant price is required",
            });
          } else if (variant.price < 0) {
            errors.push({
              field: `variants[${index}].price`,
              message: "Variant price must be greater than or equal to 0",
            });
          }
          if (variant.stock === undefined || variant.stock === null) {
            errors.push({
              field: `variants[${index}].stock`,
              message: "Variant stock is required",
            });
          } else if (variant.stock < 0) {
            errors.push({
              field: `variants[${index}].stock`,
              message: "Variant stock must be greater than or equal to 0",
            });
          }
        });
        if (
          errors.filter((e) => e.field.startsWith("variants[")).length === 0
        ) {
          updateData.variants = variants;
        }
      }
    }

    // Tags
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        errors.push({
          field: "tags",
          message: "Tags must be an array",
        });
      } else {
        updateData.tags = tags.map((t) => t.trim().toLowerCase());
      }
    }

    // Colors
    if (colors !== undefined) {
      if (!Array.isArray(colors)) {
        errors.push({
          field: "colors",
          message: "Colors must be an array",
        });
      } else {
        updateData.colors = colors.map((c) => c.trim());
      }
    }

    // Sizes
    if (sizes !== undefined) {
      if (!Array.isArray(sizes)) {
        errors.push({
          field: "sizes",
          message: "Sizes must be an array",
        });
      } else {
        updateData.sizes = sizes.map((s) => s.trim());
      }
    }

    // Stock
    if (stock !== undefined) {
      if (stock < 0) {
        errors.push({
          field: "stock",
          message: "Stock must be greater than or equal to 0",
        });
      } else {
        updateData.stock = parseInt(stock);
      }
    }

    // In stock
    if (inStock !== undefined) {
      updateData.inStock = inStock === true || inStock === "true";
    } else if (variants !== undefined || stock !== undefined) {
      // Recalculate inStock if variants or stock changed
      const calculatedStock =
        updateData.stock !== undefined
          ? updateData.stock
          : variants && Array.isArray(variants)
          ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : product.stock;
      updateData.inStock = calculatedStock > 0;
    }

    // Features
    if (features !== undefined) {
      if (!Array.isArray(features)) {
        errors.push({
          field: "features",
          message: "Features must be an array",
        });
      } else {
        updateData.features = features.map((f) => f.trim());
      }
    }

    // Shipping
    if (shipping !== undefined) {
      updateData.shipping = shipping?.trim() || product.shipping;
    }

    // Return policy
    if (returnPolicy !== undefined) {
      updateData.returnPolicy = returnPolicy?.trim() || product.returnPolicy;
    }

    // Meta title
    if (metaTitle !== undefined) {
      updateData.metaTitle = metaTitle?.trim() || null;
    }

    // Meta description
    if (metaDescription !== undefined) {
      updateData.metaDescription = metaDescription?.trim() || null;
    }

    // Meta keywords
    if (metaKeywords !== undefined) {
      if (!Array.isArray(metaKeywords)) {
        errors.push({
          field: "metaKeywords",
          message: "Meta keywords must be an array",
        });
      } else {
        updateData.metaKeywords = metaKeywords.map((k) =>
          k.trim().toLowerCase()
        );
      }
    }

    // Status
    if (status !== undefined) {
      if (
        ![
          "draft",
          "pending",
          "approved",
          "rejected",
          "active",
          "inactive",
        ].includes(status)
      ) {
        errors.push({
          field: "status",
          message:
            "Invalid status. Must be one of: draft, pending, approved, rejected, active, inactive",
        });
      } else {
        updateData.status = status;
      }
    }

    // Featured flags
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured === true || isFeatured === "true";
    }
    if (isNew !== undefined) {
      updateData.isNew = isNew === true || isNew === "true";
    }
    if (isPopular !== undefined) {
      updateData.isPopular = isPopular === true || isPopular === "true";
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

    // Update product
    Object.assign(product, updateData);
    await product.save();

    // Populate category and brand for response
    await product.populate("category", "name slug");
    await product.populate("brand", "name logo");

    // Format response
    const primaryImage =
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      null;

    const discountPercentage =
      product.originalPrice && product.originalPrice > product.basePrice
        ? Math.round(
            ((product.originalPrice - product.basePrice) /
              product.originalPrice) *
              100
          )
        : product.discount || 0;

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: {
          product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription,
            category: product.category
              ? {
                  id: product.category._id,
                  name: product.category.name,
                  slug: product.category.slug,
                }
              : null,
            brand: product.brand
              ? {
                  id: product.brand._id,
                  name: product.brand.name,
                  logo: product.brand.logo,
                }
              : null,
            basePrice: product.basePrice,
            originalPrice: product.originalPrice,
            discount: discountPercentage,
            images: product.images || [],
            primaryImage: primaryImage,
            variants: product.variants || [],
            tags: product.tags || [],
            colors: product.colors || [],
            sizes: product.sizes || [],
            stock: product.stock,
            inStock: product.inStock,
            rating: product.rating || { average: 0, count: 0 },
            reviews: product.reviews || 0,
            features: product.features || [],
            shipping: product.shipping,
            returnPolicy: product.returnPolicy,
            status: product.status,
            isFeatured: product.isFeatured,
            isNew: product.isNew,
            isPopular: product.isPopular,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            metaKeywords: product.metaKeywords || [],
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);

    // Handle duplicate key error (slug)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Product with this slug already exists",
          errors: [
            {
              field: "slug",
              message: "A product with this slug already exists",
            },
          ],
        },
        { status: 409 }
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
        message: error.message || "Failed to update product. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id
 * Delete product (Admin only) - Soft delete
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Get product ID from params
    const { id } = await params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
          errors: [
            {
              field: "id",
              message: "Product ID is required",
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

    // Find product
    const product = await Product.findOne(query);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Soft delete the product
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
        data: {
          message: "Product has been deleted successfully",
          productId: product._id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete product. Please try again.",
      },
      { status: 500 }
    );
  }
}

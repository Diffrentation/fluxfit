import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import Category from "@/models/category.model";
import slugify from "slugify";

/**
 * GET /api/products/:id
 * Get product by ID or slug using aggregation pipeline
 */
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Product ID or slug is required",
        errors: [{ field: "id", message: "Product ID or slug is required" }]
      }, { status: 400 });
    }

    // Build match conditions
    const matchConditions = { isDeleted: false };
    
    // Handle both ID and slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      matchConditions._id = new mongoose.Types.ObjectId(id);
    } else {
      matchConditions.slug = id;
    }

    // Execute aggregation pipeline
    const result = await Product.aggregate([
      // Match the product
      { $match: matchConditions },

      // Lookup category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // Lookup brand
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // Add computed fields
      {
        $addFields: {
          id: "$_id",
          primaryImage: {
            $cond: {
              if: { $gt: [{ $size: { $filter: { input: "$images", as: "img", cond: { $eq: ["$$img.isPrimary", true] } } } }, 0] },
              then: { $arrayElemAt: [{ $filter: { input: "$images", as: "img", cond: { $eq: ["$$img.isPrimary", true] } } }, 0] },
              else: { $arrayElemAt: ["$images", 0] }
            }
          },
          discountPercentage: {
            $cond: {
              if: { $and: [{ $gt: ["$originalPrice", 0] }, { $gt: ["$originalPrice", "$basePrice"] }] },
              then: { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$originalPrice", "$basePrice"] }, "$originalPrice"] }, 100] }, 0] },
              else: { $ifNull: ["$discount", 0] }
            }
          },
          availableVariants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: { $and: [{ $eq: ["$$variant.isActive", true] }, { $gt: ["$$variant.stock", 0] }] }
            }
          }
        }
      },

      // Format the output
      {
        $project: {
          _id: 1,
          id: 1,
          name: 1,
          slug: 1,
          description: 1,
          shortDescription: 1,
          basePrice: 1,
          originalPrice: 1,
          discount: "$discountPercentage",
          images: 1,
          primaryImage: { $ifNull: ["$primaryImage.url", null] },
          variants: 1,
          allVariants: "$variants",
          availableVariants: 1,
          tags: 1,
          colors: 1,
          sizes: 1,
          stock: 1,
          inStock: 1,
          rating: { $ifNull: ["$rating", { average: 0, count: 0 }] },
          reviews: { $ifNull: ["$reviews", 0] },
          features: 1,
          details: { $ifNull: ["$details", {}] },
          keyHighlights: { $ifNull: ["$keyHighlights", []] },
          specifications: { $ifNull: ["$specifications", []] },
          featureCards: { $ifNull: ["$featureCards", []] },
          shipping: 1,
          returnPolicy: 1,
          isFeatured: { $ifNull: ["$isFeatured", false] },
          isNew: { $ifNull: ["$isNew", false] },
          isPopular: { $ifNull: ["$isPopular", false] },
          isCustomizable: { $ifNull: ["$isCustomizable", false] },
          lowStockThreshold: { $ifNull: ["$lowStockThreshold", 10] },
          metaTitle: 1,
          metaDescription: 1,
          metaKeywords: { $ifNull: ["$metaKeywords", []] },
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          
          // Format category
          category: {
            $cond: {
              if: { $ne: ["$category", null] },
              then: {
                id: "$category._id",
                name: "$category.name",
                slug: "$category.slug",
                description: "$category.description",
                metaTitle: "$category.metaTitle",
                metaDescription: "$category.metaDescription",
                metaKeywords: "$category.metaKeywords"
              },
              else: null
            }
          },

          // Format brand
          brand: {
            $cond: {
              if: { $ne: ["$brand", null] },
              then: {
                id: "$brand._id",
                name: "$brand.name",
                logo: "$brand.logo",
                description: "$brand.description",
                slug: "$brand.slug"
              },
              else: null
            }
          }
        }
      }
    ]);

    // Check if product exists
    if (!result || result.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Product not found"
      }, { status: 404 });
    }

    const product = result[0];


    return NextResponse.json({
      success: true,
      message: "Product retrieved successfully",
      data: { product }
    }, { status: 200 });

  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to retrieve product. Please try again."
    }, { status: 500 });
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Product ID is required",
        errors: [{ field: "id", message: "Product ID is required" }]
      }, { status: 400 });
    }

    // Build query to find product
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find product
    const product = await Product.findOne(query);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: "Product not found"
      }, { status: 404 });
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
      details,
      keyHighlights,
      specifications,
      featureCards,
      shipping,
      returnPolicy,
      metaTitle,
      metaDescription,
      metaKeywords,
      status,
      isFeatured,
      isNew,
      isPopular,
      isCustomizable,
      slug,
    } = body;

    // Build update object with validation
    const updateData = {};
    const errors = [];

    // Validate and prepare update data
    if (name !== undefined) {
      if (!name?.trim()) {
        errors.push({ field: "name", message: "Product name cannot be empty" });
      } else {
        updateData.name = name.trim();
      }
    }

    if (description !== undefined) {
      if (!description?.trim()) {
        errors.push({ field: "description", message: "Product description cannot be empty" });
      } else if (description.trim().length > 200) {
        errors.push({ field: "description", message: "Description must be 200 characters or less" });
      } else {
        updateData.description = description.trim();
      }
    }

    if (shortDescription !== undefined) {
      if (shortDescription?.length > 200) {
        errors.push({ field: "shortDescription", message: "Short description must be 200 characters or less" });
      } else {
        updateData.shortDescription = shortDescription?.trim() || "";
      }
    }

    if (category !== undefined) {
      if (!category) {
        errors.push({ field: "category", message: "Category cannot be empty" });
      } else if (!mongoose.Types.ObjectId.isValid(category)) {
        errors.push({ field: "category", message: "Invalid category ID" });
      } else {
        // Ensure referenced category exists (soft-delete aware).
        const categoryDoc = await Category.findOne({
          _id: category,
          isDeleted: false,
        }).select("_id");

        if (!categoryDoc) {
          errors.push({
            field: "category",
            message: "Category not found",
          });
        } else {
          updateData.category = categoryDoc._id;
        }
      }
    }

    if (brand !== undefined) {
      if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
        errors.push({ field: "brand", message: "Invalid brand ID" });
      } else {
        updateData.brand = brand || null;
      }
    }

    if (basePrice !== undefined) {
      if (basePrice === null || basePrice < 0) {
        errors.push({ field: "basePrice", message: "Base price must be greater than or equal to 0" });
      } else {
        updateData.basePrice = parseFloat(basePrice);
      }
    }

    if (originalPrice !== undefined) {
      if (originalPrice !== null && originalPrice < 0) {
        errors.push({ field: "originalPrice", message: "Original price must be greater than or equal to 0" });
      } else {
        updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
      }
    }

    if (discount !== undefined) {
      if (discount < 0 || discount > 100) {
        errors.push({ field: "discount", message: "Discount must be between 0 and 100" });
      } else {
        updateData.discount = parseFloat(discount);
      }
    }

    const slugFromClientProvided = Object.prototype.hasOwnProperty.call(body, "slug");
    const nameForSlug = updateData.name !== undefined ? updateData.name : product.name;
    const metaTitleForSlug =
      metaTitle !== undefined ? metaTitle?.trim() : product.metaTitle;

    if (slugFromClientProvided || name !== undefined || metaTitle !== undefined) {
      const currentSlugNorm = String(product.slug || "").toLowerCase().trim();
      const rawSlug = slugFromClientProvided ? slug : undefined;
      const slugSource = rawSlug || metaTitleForSlug || nameForSlug;

      let nextSlug = slugify(String(slugSource || ""), {
        lower: true,
        strict: true,
        trim: true,
      });

      if (!nextSlug) {
        nextSlug = currentSlugNorm || slugify(String(nameForSlug || "product"), {
          lower: true,
          strict: true,
          trim: true,
        });
      }

      if (nextSlug && nextSlug !== currentSlugNorm) {
        const existingProduct = await Product.findOne({
          slug: nextSlug,
          _id: { $ne: product._id },
          isDeleted: false,
        });
        updateData.slug = existingProduct ? `${nextSlug}-${Date.now()}` : nextSlug;
      }
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        errors.push({ field: "images", message: "Images must be an array" });
      } else {
        images.forEach((img, index) => {
          if (!img.url?.trim()) {
            errors.push({ field: `images[${index}].url`, message: "Image URL is required" });
          }
        });
        if (!errors.some(e => e.field.startsWith("images["))) {
          updateData.images = images;
        }
      }
    }

    if (variants !== undefined) {
      if (!Array.isArray(variants)) {
        errors.push({ field: "variants", message: "Variants must be an array" });
      } else {
        variants.forEach((variant, index) => {
          if (!variant.size?.trim()) {
            errors.push({ field: `variants[${index}].size`, message: "Variant size is required" });
          }
          if (!variant.color?.trim()) {
            errors.push({ field: `variants[${index}].color`, message: "Variant color is required" });
          }
          if (variant.price === undefined || variant.price === null) {
            errors.push({ field: `variants[${index}].price`, message: "Variant price is required" });
          } else if (variant.price < 0) {
            errors.push({ field: `variants[${index}].price`, message: "Variant price must be >= 0" });
          }
          if (variant.stock === undefined || variant.stock === null) {
            errors.push({ field: `variants[${index}].stock`, message: "Variant stock is required" });
          } else if (variant.stock < 0) {
            errors.push({ field: `variants[${index}].stock`, message: "Variant stock must be >= 0" });
          }
        });
        if (!errors.some(e => e.field.startsWith("variants["))) {
          updateData.variants = variants;
        }
      }
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        errors.push({ field: "tags", message: "Tags must be an array" });
      } else {
        updateData.tags = tags.map(t => t.trim().toLowerCase());
      }
    }

    if (colors !== undefined) {
      if (!Array.isArray(colors)) {
        errors.push({ field: "colors", message: "Colors must be an array" });
      } else {
        updateData.colors = colors.map(c => c.trim());
      }
    }

    if (sizes !== undefined) {
      if (!Array.isArray(sizes)) {
        errors.push({ field: "sizes", message: "Sizes must be an array" });
      } else {
        updateData.sizes = sizes.map(s => s.trim());
      }
    }

    if (stock !== undefined) {
      if (stock < 0) {
        errors.push({ field: "stock", message: "Stock must be >= 0" });
      } else {
        updateData.stock = parseInt(stock);
      }
    }

    if (inStock !== undefined) {
      updateData.inStock = inStock === true || inStock === "true";
    } else if (variants !== undefined || stock !== undefined) {
      const calculatedStock = updateData.stock !== undefined
        ? updateData.stock
        : (variants && Array.isArray(variants))
          ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : product.stock;
      updateData.inStock = calculatedStock > 0;
    }

    if (features !== undefined) {
      if (!Array.isArray(features)) {
        errors.push({ field: "features", message: "Features must be an array" });
      } else {
        updateData.features = features.map(f => f.trim());
      }
    }

    if (details !== undefined) updateData.details = details;
    if (keyHighlights !== undefined) {
      if (!Array.isArray(keyHighlights)) {
        errors.push({ field: "keyHighlights", message: "Key Highlights must be an array" });
      } else {
        updateData.keyHighlights = keyHighlights;
      }
    }
    if (specifications !== undefined) {
      if (!Array.isArray(specifications)) {
        errors.push({ field: "specifications", message: "Specifications must be an array" });
      } else {
        updateData.specifications = specifications;
      }
    }
    if (featureCards !== undefined) {
      if (!Array.isArray(featureCards)) {
        errors.push({ field: "featureCards", message: "Feature Cards must be an array" });
      } else {
        updateData.featureCards = featureCards;
      }
    }

    if (shipping !== undefined) updateData.shipping = shipping?.trim() || null;
    if (returnPolicy !== undefined) updateData.returnPolicy = returnPolicy?.trim() || null;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription?.trim() || null;

    if (metaKeywords !== undefined) {
      if (!Array.isArray(metaKeywords)) {
        errors.push({ field: "metaKeywords", message: "Meta keywords must be an array" });
      } else {
        updateData.metaKeywords = metaKeywords.map(k => k.trim().toLowerCase());
      }
    }

    if (status !== undefined) {
      const validStatuses = ["draft", "pending", "approved", "rejected", "active", "inactive"];
      if (!validStatuses.includes(status)) {
        errors.push({ field: "status", message: "Invalid status value" });
      } else {
        updateData.status = status;
      }
    }

    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === true || isFeatured === "true";
    if (isNew !== undefined) updateData.isNew = isNew === true || isNew === "true";
    if (isPopular !== undefined) updateData.isPopular = isPopular === true || isPopular === "true";
    if (isCustomizable !== undefined) updateData.isCustomizable = isCustomizable === true || isCustomizable === "true";

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: "Validation failed", errors }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: "No fields provided to update",
        errors: [{ field: "body", message: "Please provide at least one field to update" }]
      }, { status: 400 });
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    // Fetch updated product using pipeline for consistent response
    const updatedResult = await Product.aggregate([
      { $match: { _id: product._id, isDeleted: false } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: "$_id",
          primaryImage: {
            $cond: {
              if: { $gt: [{ $size: { $filter: { input: "$images", as: "img", cond: { $eq: ["$$img.isPrimary", true] } } } }, 0] },
              then: { $arrayElemAt: [{ $filter: { input: "$images", as: "img", cond: { $eq: ["$$img.isPrimary", true] } } }, 0] },
              else: { $arrayElemAt: ["$images", 0] }
            }
          },
          discountPercentage: {
            $cond: {
              if: { $and: [{ $gt: ["$originalPrice", 0] }, { $gt: ["$originalPrice", "$basePrice"] }] },
              then: { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$originalPrice", "$basePrice"] }, "$originalPrice"] }, 100] }, 0] },
              else: { $ifNull: ["$discount", 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          id: 1,
          name: 1,
          slug: 1,
          description: 1,
          shortDescription: 1,
          basePrice: 1,
          originalPrice: 1,
          discount: "$discountPercentage",
          images: 1,
          primaryImage: { $ifNull: ["$primaryImage.url", null] },
          variants: 1,
          tags: 1,
          colors: 1,
          sizes: 1,
          stock: 1,
          inStock: 1,
          rating: { $ifNull: ["$rating", { average: 0, count: 0 }] },
          reviews: { $ifNull: ["$reviews", 0] },
          features: 1,
          details: { $ifNull: ["$details", {}] },
          keyHighlights: { $ifNull: ["$keyHighlights", []] },
          specifications: { $ifNull: ["$specifications", []] },
          featureCards: { $ifNull: ["$featureCards", []] },
          shipping: 1,
          returnPolicy: 1,
          status: 1,
          isFeatured: 1,
          isNew: 1,
          isPopular: 1,
          isCustomizable: 1,
          metaTitle: 1,
          metaDescription: 1,
          metaKeywords: 1,
          createdAt: 1,
          updatedAt: 1,
          category: {
            $cond: {
              if: { $ne: ["$category", null] },
              then: {
                id: "$category._id",
                name: "$category.name",
                slug: "$category.slug"
              },
              else: null
            }
          },
          brand: {
            $cond: {
              if: { $ne: ["$brand", null] },
              then: {
                id: "$brand._id",
                name: "$brand.name",
                logo: "$brand.logo"
              },
              else: null
            }
          }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: { product: updatedResult[0] }
    }, { status: 200 });

  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: "Product with this slug already exists",
        errors: [{ field: "slug", message: "A product with this slug already exists" }]
      }, { status: 409 });
    }

    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return NextResponse.json({ success: false, message: "Validation error", errors }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update product. Please try again."
    }, { status: 500 });
  }
}

/**
 * DELETE /api/products/:id
 * Delete product (Admin only) - Soft delete
 */
export async function DELETE(request, { params }) {
  try {
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) return error;

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Product ID is required",
        errors: [{ field: "id", message: "Product ID is required" }]
      }, { status: 400 });
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    const product = await Product.findOne(query);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      data: { message: "Product has been deleted successfully", productId: product._id }
    }, { status: 200 });

  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to delete product. Please try again."
    }, { status: 500 });
  }
}
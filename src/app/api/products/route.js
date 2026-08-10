import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import Category from "@/models/category.model"
import slugify from "slugify";

/**
 * GET /api/products
 * Get all products with pagination, filters, and search
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search query (searches in name, description, tags)
 * - category: Category ID or slug
 * - brand: Brand ID
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - color: Filter by color
 * - size: Filter by size
 * - tags: Comma-separated tags
 * - inStock: Filter by stock availability (true/false)
 * - status: Product status (default: "active")
 * - isFeatured: Filter featured products (true/false)
 * - isNew: Filter new products (true/false)
 * - isPopular: Filter popular products (true/false)
 * - minRating: Minimum average rating (0-5)
 * - sort: Sort field and order (e.g., "price-asc", "price-desc", "rating-desc", "createdAt-desc")
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const search = searchParams.get("search") || "";
    const category =
      searchParams.get("subcategoryId") ||
      searchParams.get("categoryId") ||
      searchParams.get("category");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const color = searchParams.get("color");
    const size = searchParams.get("size");
    const tags = searchParams.get("tags");
    const inStock = searchParams.get("inStock");
    const status = searchParams.get("status");
    const isFeatured = searchParams.get("isFeatured");
    const isNew = searchParams.get("isNew");
    const isPopular = searchParams.get("isPopular");
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort") || "createdAt-desc";

    // 1. Build Match Query
    const query = { isDeleted: false };
    if (status) query.status = status;
    if (search?.trim()) query.$text = { $search: search.trim() };
    
    // Category Logic (hierarchy-aware):
    // - Resolve incoming `category` (id or slug) -> categoryId
    // - Always include selected category + all descendants using $graphLookup
    //   so selecting a parent includes products from its whole subtree.
    if (category) {
      let categoryId = null;

      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = new mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await Category.findOne({
          slug: category,
          isDeleted: false,
        }).select("_id");
        if (categoryDoc) categoryId = categoryDoc._id;
      }

      if (categoryId) {
        const selectedCategoryDoc = await Category.findOne({
          _id: categoryId,
          isDeleted: false,
        }).select("parent");

        // Match your click semantics:
        // - clicking a top-level parent category (parent === null) includes descendants
        // - clicking a nested subcategory filters only that category
        const isTopLevelParent = !selectedCategoryDoc?.parent;

        if (isTopLevelParent) {
          const categoryTree = await Category.aggregate([
            { $match: { _id: categoryId, isDeleted: false } },
            {
              $graphLookup: {
                from: "categories",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "parent",
                as: "descendants",
                restrictSearchWithMatch: { isDeleted: false },
              },
            },
            {
              $project: {
                descendantIds: {
                  $concatArrays: [["$_id"], "$descendants._id"],
                },
              },
            },
          ]);

          const descendantIds =
            categoryTree?.[0]?.descendantIds?.map(
              (id) => new mongoose.Types.ObjectId(id),
            ) || [categoryId];

          query.category = { $in: descendantIds };
        } else {
          query.category = categoryId;
        }
      }
    }

    if (brand && mongoose.Types.ObjectId.isValid(brand)) {
      query.brand = new mongoose.Types.ObjectId(brand);
    }

    // Price filter: allow 0 values (use explicit checks, not truthiness)
    if (
      (minPrice !== null && minPrice !== undefined && String(minPrice).trim() !== "") ||
      (maxPrice !== null && maxPrice !== undefined && String(maxPrice).trim() !== "")
    ) {
      query.basePrice = {};
      if (minPrice !== null && minPrice !== undefined && String(minPrice).trim() !== "") {
        query.basePrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== null && maxPrice !== undefined && String(maxPrice).trim() !== "") {
        query.basePrice.$lte = parseFloat(maxPrice);
      }
    }

    // Color/size live either on the top-level colors/sizes arrays (when set
    // at product creation) or only on individual variants (variants.color /
    // variants.size) — most products in this catalog only have the latter,
    // so match either to avoid the filter always returning zero results.
    const andConditions = [];
    if (color) {
      // Color values in this catalog aren't consistently cased ("black" vs
      // "WHITE"), so match case-insensitively rather than requiring the
      // filter UI to guess the exact stored casing.
      const colorRe = new RegExp(`^${color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      andConditions.push({
        $or: [{ colors: { $in: [colorRe] } }, { "variants.color": colorRe }],
      });
    }
    if (size) {
      const sizeRe = new RegExp(`^${size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      andConditions.push({
        $or: [{ sizes: { $in: [sizeRe] } }, { "variants.size": sizeRe }],
      });
    }
    if (tags) query.tags = { $in: tags.split(",").map(t => t.trim().toLowerCase()) };
    if (andConditions.length > 0) query.$and = andConditions;
    if (inStock !== null) query.inStock = inStock === "true";
    if (isFeatured !== null) query.isFeatured = isFeatured === "true";
    if (isNew !== null) query.isNew = isNew === "true";
    if (isPopular !== null) query.isPopular = isPopular === "true";
    if (minRating !== null && String(minRating).trim() !== "") {
      query["rating.average"] = { $gte: parseFloat(minRating) };
    }

    // 2. Build Sort Object
    let sortObj = {};
    const [sortField, sortOrderStr] = sort.split("-");
    const sortOrder = sortOrderStr === "asc" ? 1 : -1;

    switch (sortField) {
      case "price": sortObj.basePrice = sortOrder; break;
      case "rating": sortObj["rating.average"] = sortOrder; break;
      case "name": sortObj.name = sortOrder; break;
      case "popularity": sortObj["rating.count"] = sortOrder; break;
      default: sortObj.createdAt = -1;
    }
    if (search?.trim()) sortObj.score = { $meta: "textScore" };

    // 3. Execute Unified Pipeline
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: query },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
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
                  $ifNull: [
                    { $filter: { input: "$images", as: "img", cond: { $eq: ["$$img.isPrimary", true] } } },
                    { $slice: ["$images", 1] }
                  ]
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
                name: 1,
                slug: 1,
                description: 1,
                basePrice: 1,
                originalPrice: 1,
                stock: 1,
                inStock: 1,
                images: 1,
                variants: 1,
                tags: 1,
                colors: 1,
                sizes: 1,
                rating: 1,
                features: 1,
                isFeatured: 1,
                isNew: 1,
                isPopular: 1,
                isCustomizable: 1,
                createdAt: 1,
                updatedAt: 1,

                category: {
                  _id: "$category._id",
                  name: "$category.name",
                  slug: "$category.slug",
                  metaTitle: "$category.metaTitle",
                  metaDescription: "$category.metaDescription",
                  metaKeywords: "$category.metaKeywords",
                  parent: "$category.parent"
                },

                brand: {
                  _id: "$brand._id",
                  name: "$brand.name",
                  logo: "$brand.logo",
                  slug: "$brand.slug",
                  description: "$brand.description"
                }
              }
            }         
           ]
        }
      }
    ];

    let result;
    try {
      result = await Product.aggregate(pipeline);
    } catch (err) {
      if (err.message.includes("text index required") || err.code === 27) {
        console.warn("Text index missing in Products API GET, rebuilding and falling back to regex:", err);
        Product.ensureIndexes().catch(console.error);

        delete query.$text;
        query.name = { $regex: search.trim(), $options: "i" };

        if (sortObj.score) {
          delete sortObj.score;
          if (Object.keys(sortObj).length === 0) {
            sortObj.createdAt = -1;
          }
        }

        pipeline[0].$match = query;
        pipeline[1].$facet.data[0].$sort = sortObj;

        result = await Product.aggregate(pipeline);
      } else {
        throw err;
      }
    }

    const products = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    return NextResponse.json({
      success: true,
      message: "Products retrieved successfully",
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: { ...Object.fromEntries(searchParams), sort }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create new product (Admin only)
 */
export async function POST(request) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
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
      status = "draft",
      isFeatured = false,
      isNew = false,
      isPopular = false,
      isCustomizable = false,
    } = body;

    // Validate required fields
    const errors = [];

    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Product name is required",
      });
    }

    if (!description || !description.trim()) {
      errors.push({
        field: "description",
        message: "Product description is required",
      });
    } else if (description.trim().length > 200) {
      errors.push({
        field: "description",
        message: "Description must be 200 characters or less",
      });
    }

    if (!category) {
      errors.push({
        field: "category",
        message: "Category is required",
      });
    } else if (!mongoose.Types.ObjectId.isValid(category)) {
      errors.push({
        field: "category",
        message: "Invalid category ID",
      });
    }

    if (basePrice === undefined || basePrice === null) {
      errors.push({
        field: "basePrice",
        message: "Base price is required",
      });
    } else if (basePrice < 0) {
      errors.push({
        field: "basePrice",
        message: "Base price must be greater than or equal to 0",
      });
    }

    if (
      originalPrice !== undefined &&
      originalPrice !== null &&
      originalPrice < 0
    ) {
      errors.push({
        field: "originalPrice",
        message: "Original price must be greater than or equal to 0",
      });
    }

    if (discount !== undefined && (discount < 0 || discount > 100)) {
      errors.push({
        field: "discount",
        message: "Discount must be between 0 and 100",
      });
    }

    if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
      errors.push({
        field: "brand",
        message: "Invalid brand ID",
      });
    }

    if (shortDescription && shortDescription.length > 200) {
      errors.push({
        field: "shortDescription",
        message: "Short description must be 200 characters or less",
      });
    }

    if (
      status &&
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
    }

    // Validate images
    if (images && Array.isArray(images)) {
      images.forEach((img, index) => {
        if (!img.url || !img.url.trim()) {
          errors.push({
            field: `images[${index}].url`,
            message: "Image URL is required",
          });
        }
      });
    }

    // Validate variants
    if (variants && Array.isArray(variants)) {
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
    }

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

    const slugSource = body.slug || metaTitle || name;
    let slug = slugify(String(slugSource || ""), {
      lower: true,
      strict: true,
      trim: true,
    });

    if (!slug) {
      slug = slugify(String(name || "product"), {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    // Ensure slug uniqueness before saving
    const existingProduct = await Product.findOne({ slug, isDeleted: false });
    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    // Stock is auto-computed by pre-save middleware from variants; send 0 as placeholder.
    const calculatedStock =
      variants && Array.isArray(variants) && variants.length > 0
        ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : typeof stock === "number" ? stock : 0;

    // Build product data
    const productData = {
      name: name.trim(),
      slug,
      description: description.trim(),
      shortDescription: shortDescription?.trim() || "",
      category,
      basePrice: parseFloat(basePrice),
      stock: calculatedStock,
      inStock: calculatedStock > 0,
      status,
      isFeatured: isFeatured || false,
      isNew: isNew || false,
      isPopular: isPopular || false,
      isCustomizable: isCustomizable || false,
    };

    // Add optional fields
    if (brand) productData.brand = brand;
    if (originalPrice !== undefined)
      productData.originalPrice = parseFloat(originalPrice);
    if (discount !== undefined) productData.discount = parseFloat(discount);
    if (images && Array.isArray(images)) productData.images = images;
    if (variants && Array.isArray(variants)) productData.variants = variants;
    if (tags && Array.isArray(tags))
      productData.tags = tags.map((t) => t.trim().toLowerCase());
    if (colors && Array.isArray(colors))
      productData.colors = colors.map((c) => c.trim());
    if (sizes && Array.isArray(sizes))
      productData.sizes = sizes.map((s) => s.trim());
    if (features && Array.isArray(features))
      productData.features = features.map((f) => f.trim());
    if (details) productData.details = details;
    if (keyHighlights && Array.isArray(keyHighlights)) productData.keyHighlights = keyHighlights;
    if (specifications && Array.isArray(specifications)) productData.specifications = specifications;
    if (featureCards && Array.isArray(featureCards)) productData.featureCards = featureCards;
    if (shipping) productData.shipping = shipping.trim();
    if (returnPolicy) productData.returnPolicy = returnPolicy.trim();
    if (metaTitle) productData.metaTitle = metaTitle.trim();
    if (metaDescription) productData.metaDescription = metaDescription.trim();
    if (metaKeywords && Array.isArray(metaKeywords)) {
      productData.metaKeywords = metaKeywords.map((k) =>
        k.trim().toLowerCase()
      );
    }

    // Create product
    const newProduct = new Product(productData);
    await newProduct.save();

    // Populate category and brand for response
    await newProduct.populate("category", "name slug");
    await newProduct.populate("brand", "name logo");

    // Format response
    const primaryImage =
      newProduct.images?.find((img) => img.isPrimary)?.url ||
      newProduct.images?.[0]?.url ||
      null;

    const discountPercentage =
      newProduct.originalPrice &&
      newProduct.originalPrice > newProduct.basePrice
        ? Math.round(
            ((newProduct.originalPrice - newProduct.basePrice) /
              newProduct.originalPrice) *
              100
          )
        : newProduct.discount || 0;

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: {
          product: {
            id: newProduct._id,
            name: newProduct.name,
            slug: newProduct.slug,
            description: newProduct.description,
            shortDescription: newProduct.shortDescription,
            category: newProduct.category
              ? {
                  id: newProduct.category._id,
                  name: newProduct.category.name,
                  slug: newProduct.category.slug,
                }
              : null,
            brand: newProduct.brand
              ? {
                  id: newProduct.brand._id,
                  name: newProduct.brand.name,
                  logo: newProduct.brand.logo,
                }
              : null,
            basePrice: newProduct.basePrice,
            originalPrice: newProduct.originalPrice,
            discount: discountPercentage,
            images: newProduct.images || [],
            primaryImage: primaryImage,
            variants: newProduct.variants || [],
            tags: newProduct.tags || [],
            colors: newProduct.colors || [],
            sizes: newProduct.sizes || [],
            stock: newProduct.stock,
            inStock: newProduct.inStock,
            features: newProduct.features || [],
            details: newProduct.details || {},
            keyHighlights: newProduct.keyHighlights || [],
            specifications: newProduct.specifications || [],
            featureCards: newProduct.featureCards || [],
            shipping: newProduct.shipping,
            returnPolicy: newProduct.returnPolicy,
            status: newProduct.status,
            isFeatured: newProduct.isFeatured,
            isNew: newProduct.isNew,
            isPopular: newProduct.isPopular,
            createdAt: newProduct.createdAt,
            updatedAt: newProduct.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

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
        message: error.message || "Failed to create product. Please try again.",
      },
      { status: 500 }
    );
  }
}

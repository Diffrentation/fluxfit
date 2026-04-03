import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/products/search
 * Search products with advanced filtering
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - category: Category ID or slug
 * - brand: Brand ID
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - color: Filter by color
 * - size: Filter by size
 * - tags: Comma-separated tags
 * - inStock: Filter by stock availability (true/false)
 * - sort: Sort field and order (e.g., "price-asc", "price-desc", "rating-desc", "createdAt-desc")
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const color = searchParams.get("color");
    const size = searchParams.get("size");
    const tags = searchParams.get("tags");
    const inStock = searchParams.get("inStock");
    const sort = searchParams.get("sort") || "createdAt-desc";

    // Validate search query
    if (!q || !q.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Search query is required",
          errors: [
            {
              field: "q",
              message: "Please provide a search query",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query
    const query = {
      isDeleted: false,
      status: "active",
    };

    // Text search (using MongoDB text search)
    query.$text = { $search: q.trim() };

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        // If it's a slug, we'd need to lookup category first
        // For now, assume it's an ID
        query.category = category;
      }
    }

    // Brand filter
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        query.brand = brand;
      }
    }

    // Price range filter (allow 0)
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

    // Color filter
    if (color) {
      query.colors = { $in: [color] };
    }

    // Size filter
    if (size) {
      query.sizes = { $in: [size] };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    // Stock filter
    if (inStock !== null && inStock !== undefined) {
      query.inStock = inStock === "true" || inStock === true;
    }

    // Build sort object
    let sortObj = {};
    const sortParts = sort.split("-");
    const sortField = sortParts[0];
    const sortOrder = sortParts[1] === "asc" ? 1 : -1;

    switch (sortField) {
      case "price":
        sortObj.basePrice = sortOrder;
        break;
      case "rating":
        sortObj["rating.average"] = sortOrder;
        break;
      case "createdAt":
        sortObj.createdAt = sortOrder;
        break;
      case "name":
        sortObj.name = sortOrder;
        break;
      case "popularity":
        sortObj["rating.count"] = sortOrder;
        break;
      default:
        sortObj.createdAt = -1;
    }

    // Add text score to sort for relevance
    sortObj.score = { $meta: "textScore" };

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("brand", "name logo")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Format products for response
    const formattedProducts = products.map((product) => {
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

      return {
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
        isFeatured: product.isFeatured || false,
        isNew: product.isNew || false,
        isPopular: product.isPopular || false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Search completed successfully",
        data: {
          query: q.trim(),
          products: formattedProducts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            category: category || null,
            brand: brand || null,
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            color: color || null,
            size: size || null,
            tags: tags ? tags.split(",").map((t) => t.trim()) : null,
            inStock: inStock !== null ? inStock === "true" : null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search products error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to search products. Please try again.",
      },
      { status: 500 }
    );
  }
}


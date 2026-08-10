import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RecentlyViewed from "@/models/recentlyviewed.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/recently-viewed
 * Get recently viewed products
 * 
 * Query Parameters:
 * - limit: Maximum number of products to return (default: 20, max: 50)
 * - page: Page number for pagination (default: 1)
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 50);
    const page = parseInt(searchParams.get("page")) || 1;

    // Get or create recently viewed for user
    let recentlyViewed = await RecentlyViewed.findOne({ user: user._id })
      .populate({
        path: "products.product",
        select: "name slug basePrice originalPrice discount images stock inStock category brand tags description",
        populate: [
          { path: "category", select: "name slug" },
          { path: "brand", select: "name slug" },
        ],
      })
      .lean();

    if (!recentlyViewed) {
      return NextResponse.json(
        {
          success: true,
          message: "No recently viewed products found",
          data: {
            products: [],
            total: 0,
            pagination: {
              page: 1,
              limit,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        },
        { status: 200 }
      );
    }

    // Sort products by viewedAt (most recent first)
    const sortedProducts = recentlyViewed.products
      .filter((item) => item.product && !item.product.isdeleted) // Filter out deleted products
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedProducts = sortedProducts.slice(skip, skip + limit);

    // Format products
    const formattedProducts = paginatedProducts.map((item) => {
      const product = item.product;
      return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        originalPrice: product.originalPrice || null,
        discount: product.discount || 0,
        image:
          product.images?.find((img) => img.isPrimary)?.url ||
          product.images?.[0]?.url ||
          null,
        stock: product.stock,
        inStock: product.inStock,
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
              slug: product.brand.slug,
            }
          : null,
        tags: product.tags || [],
        description: product.description,
        viewedAt: item.viewedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Recently viewed products retrieved successfully",
        data: {
          products: formattedProducts,
          total: sortedProducts.length,
          pagination: {
            page,
            limit,
            total: sortedProducts.length,
            totalPages: Math.ceil(sortedProducts.length / limit),
            hasNextPage: page < Math.ceil(sortedProducts.length / limit),
            hasPrevPage: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get recently viewed products error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve recently viewed products. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recently-viewed
 * Add product to recently viewed
 * 
 * Request Body:
 * - productId: Product ID to add (required)
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get request body
    const body = await request.json();
    const { productId } = body;

    // Validate productId
    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 }
      );
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID format",
        },
        { status: 400 }
      );
    }

    // Check if product exists and is not deleted
    const product = await Product.findOne({
      _id: productId,
      isdeleted: false,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or has been deleted",
        },
        { status: 404 }
      );
    }

    // Get or create recently viewed for user
    let recentlyViewed = await RecentlyViewed.getOrCreate(user._id);

    // Add product using the model method
    await recentlyViewed.addProduct(productId);

    // Reload to get populated data
    recentlyViewed = await RecentlyViewed.findById(recentlyViewed._id)
      .populate({
        path: "products.product",
        select: "name slug basePrice originalPrice discount images stock inStock category brand tags description",
        populate: [
          { path: "category", select: "name slug" },
          { path: "brand", select: "name slug" },
        ],
      })
      .lean();

    // Get the newly added product
    const addedProduct = recentlyViewed.products
      .filter((item) => item.product && item.product._id.toString() === productId)
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))[0];

    if (!addedProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to add product to recently viewed",
        },
        { status: 500 }
      );
    }

    // Format product
    const productData = addedProduct.product;
    const formattedProduct = {
      id: productData._id,
      name: productData.name,
      slug: productData.slug,
      basePrice: productData.basePrice,
      originalPrice: productData.originalPrice || null,
      discount: productData.discount || 0,
      image:
        productData.images?.find((img) => img.isPrimary)?.url ||
        productData.images?.[0]?.url ||
        null,
      stock: productData.stock,
      inStock: productData.inStock,
      category: productData.category
        ? {
            id: productData.category._id,
            name: productData.category.name,
            slug: productData.category.slug,
          }
        : null,
      brand: productData.brand
        ? {
            id: productData.brand._id,
            name: productData.brand.name,
            slug: productData.brand.slug,
          }
        : null,
      tags: productData.tags || [],
      description: productData.description,
      viewedAt: addedProduct.viewedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Product added to recently viewed successfully",
        data: {
          product: formattedProduct,
          totalProducts: recentlyViewed.products.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to recently viewed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add product to recently viewed. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Wishlist from "@/models/wishlist.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/wishlist/items
 * Add item to wishlist
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

    // Parse request body
    const body = await request.json();
    const { productId } = body;

    // Validate required fields
    const errors = [];

    if (!productId) {
      errors.push({
        field: "productId",
        message: "Product ID is required",
      });
    } else if (!mongoose.Types.ObjectId.isValid(productId)) {
      errors.push({
        field: "productId",
        message: "Invalid product ID format",
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

    // Find product
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get or create wishlist
    const wishlist = await Wishlist.getOrCreate(user._id);

    // Check if product is already in wishlist
    if (wishlist.hasProduct(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is already in wishlist",
          errors: [
            {
              field: "productId",
              message: "This product is already in your wishlist",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Add product to wishlist
    await wishlist.addProduct(productId);

    // Reload wishlist with populated product
    await wishlist.populate({
      path: "items.product",
      select: "name slug images basePrice originalPrice inStock stock category brand",
      populate: [
        {
          path: "category",
          select: "name slug",
        },
        {
          path: "brand",
          select: "name logo",
        },
      ],
    });

    // Find the added item
    const addedItem = wishlist.items.find(
      (item) => item.product._id.toString() === productId.toString()
    );

    // Format response
    const productData = addedItem.product;
    const primaryImage =
      productData.images?.find((img) => img.isPrimary)?.url ||
      productData.images?.[0]?.url ||
      null;

    // Calculate discount percentage
    const discountPercentage =
      productData.originalPrice && productData.originalPrice > productData.basePrice
        ? Math.round(
            ((productData.originalPrice - productData.basePrice) /
              productData.originalPrice) *
              100
          )
        : 0;

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Item added to wishlist successfully",
        data: {
          item: {
            id: addedItem._id,
            product: {
              id: productData._id,
              name: productData.name,
              slug: productData.slug,
              image: primaryImage,
              basePrice: productData.basePrice,
              originalPrice: productData.originalPrice || null,
              discount: discountPercentage,
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
                    logo: productData.brand.logo || null,
                  }
                : null,
              inStock: productData.inStock,
              stock: productData.stock,
            },
            addedAt: addedItem.addedAt,
          },
          wishlist: {
            itemCount: wishlist.items.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add item to wishlist error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to add item to wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Wishlist from "@/models/wishlist.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/wishlist/check/:productId
 * Check if product is in wishlist
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get product ID from params
    const { productId } = params;

    // Validate product ID
    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
          errors: [
            {
              field: "productId",
              message: "Product ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID format",
          errors: [
            {
              field: "productId",
              message: "Product ID must be a valid ObjectId",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    }).select("name slug");

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get or create wishlist for user
    const wishlist = await Wishlist.getOrCreate(user._id);

    // Check if product is in wishlist
    const isInWishlist = wishlist.hasProduct(productId);

    // Find the item if it exists
    let wishlistItem = null;
    if (isInWishlist) {
      const item = wishlist.items.find(
        (item) => item.product.toString() === productId.toString()
      );
      if (item) {
        wishlistItem = {
          id: item._id,
          addedAt: item.addedAt,
        };
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Wishlist check completed",
        data: {
          product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
          },
          isInWishlist: isInWishlist,
          wishlistItem: wishlistItem,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check wishlist error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}


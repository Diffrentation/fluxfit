import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Wishlist from "@/models/wishlist.model";
import { authenticateUser } from "@/lib/auth";

/**
 * GET /api/wishlist
 * Get user's wishlist
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

    // Get or create wishlist for user
    const wishlist = await Wishlist.getOrCreate(user._id);

    // Populate product details
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

    // Format wishlist items
    const formattedItems = wishlist.items.map((item) => {
      const product = item.product;
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
          : 0;

      return {
        id: item._id,
        product: {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
          basePrice: product.basePrice,
          originalPrice: product.originalPrice || null,
          discount: discountPercentage,
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
                logo: product.brand.logo || null,
              }
            : null,
          inStock: product.inStock,
          stock: product.stock,
        },
        addedAt: item.addedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Wishlist retrieved successfully",
        data: {
          wishlist: {
            id: wishlist._id,
            items: formattedItems,
            itemCount: formattedItems.length,
            lastUpdated: wishlist.lastUpdated,
            createdAt: wishlist.createdAt,
            updatedAt: wishlist.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 */
export async function DELETE(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get user's wishlist
    const wishlist = await Wishlist.findOne({ user: user._id });

    if (!wishlist) {
      return NextResponse.json(
        {
          success: false,
          message: "Wishlist not found",
        },
        { status: 404 }
      );
    }

    // Clear wishlist
    await wishlist.clear();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Wishlist cleared successfully",
        data: {
          message: "All items have been removed from wishlist",
          wishlist: {
            id: wishlist._id,
            itemCount: 0,
            lastUpdated: wishlist.lastUpdated,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to clear wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}


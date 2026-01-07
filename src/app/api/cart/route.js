import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import { authenticateUser } from "@/lib/auth";

/**
 * GET /api/cart
 * Get user's cart
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

    // Get or create cart for user
    const cart = await Cart.getOrCreate(user._id);

    // Populate product details
    await cart.populate({
      path: "items.product",
      select: "name slug images basePrice originalPrice inStock stock",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    // Format cart items
    const formattedItems = cart.items.map((item) => {
      const product = item.product;
      const primaryImage =
        product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      return {
        id: item._id,
        product: {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
          category: product.category
            ? {
                id: product.category._id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          inStock: product.inStock,
          stock: product.stock,
        },
        variant: {
          size: item.variant.size || null,
          color: item.variant.color || null,
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        addedAt: item.addedAt,
      };
    });

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discountAmount = 0;
    if (cart.coupon && cart.coupon.code) {
      if (cart.coupon.type === "percentage") {
        discountAmount = (subtotal * cart.coupon.discount) / 100;
      } else {
        discountAmount = cart.coupon.discount;
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Cart retrieved successfully",
        data: {
          cart: {
            id: cart._id,
            items: formattedItems,
            itemCount: itemCount,
            subtotal: subtotal,
            coupon: cart.coupon.code
              ? {
                  code: cart.coupon.code,
                  discount: cart.coupon.discount,
                  type: cart.coupon.type,
                  discountAmount: discountAmount,
                }
              : null,
            total: total,
            lastUpdated: cart.lastUpdated,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve cart. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clear entire cart
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

    // Get user's cart
    const cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart not found",
        },
        { status: 404 }
      );
    }

    // Clear cart
    await cart.clear();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Cart cleared successfully",
        data: {
          message: "All items have been removed from cart",
          cart: {
            id: cart._id,
            itemCount: 0,
            subtotal: 0,
            total: 0,
            coupon: null,
            lastUpdated: cart.lastUpdated,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to clear cart. Please try again.",
      },
      { status: 500 }
    );
  }
}


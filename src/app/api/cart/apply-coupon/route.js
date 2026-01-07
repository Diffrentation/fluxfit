import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import Coupon from "@/models/coupon.model";
import { authenticateUser } from "@/lib/auth";

/**
 * POST /api/cart/apply-coupon
 * Apply coupon code to cart
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
    const { code } = body;

    // Validate coupon code
    if (!code || !code.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code is required",
          errors: [
            {
              field: "code",
              message: "Coupon code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get or create user's cart
    const cart = await Cart.getOrCreate(user._id);

    // Populate cart items to calculate subtotal
    await cart.populate({
      path: "items.product",
      select: "name basePrice category brand",
    });

    // Calculate cart subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Check if cart has items
    if (cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot apply coupon to empty cart",
          errors: [
            {
              field: "cart",
              message: "Your cart is empty. Add items to apply a coupon.",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Find and validate coupon
    const couponResult = await Coupon.findValid(
      code.trim().toUpperCase(),
      subtotal,
      user._id.toString()
    );

    if (!couponResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: couponResult.message || "Invalid coupon code",
          errors: [
            {
              field: "code",
              message: couponResult.message || "Invalid coupon code",
            },
          ],
        },
        { status: 400 }
      );
    }

    const coupon = couponResult.coupon;

    // Check if coupon is applicable to cart items
    if (coupon.applicableTo !== "all") {
      let isApplicable = false;

      if (coupon.applicableTo === "categories") {
        const cartCategories = cart.items.map(
          (item) => item.product.category?.toString()
        );
        isApplicable = coupon.categories.some((catId) =>
          cartCategories.includes(catId.toString())
        );
      } else if (coupon.applicableTo === "products") {
        const cartProductIds = cart.items.map((item) =>
          item.product._id.toString()
        );
        isApplicable = coupon.products.some((prodId) =>
          cartProductIds.includes(prodId.toString())
        );
      } else if (coupon.applicableTo === "brands") {
        const cartBrands = cart.items.map(
          (item) => item.product.brand?.toString()
        );
        isApplicable = coupon.brands.some((brandId) =>
          cartBrands.includes(brandId.toString())
        );
      }

      if (!isApplicable) {
        return NextResponse.json(
          {
            success: false,
            message: "Coupon is not applicable to items in your cart",
            errors: [
              {
                field: "code",
                message: "This coupon cannot be applied to the items in your cart",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    const discountAmount = coupon.calculateDiscount(subtotal);

    // Apply coupon to cart
    await cart.applyCoupon({
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
    });

    // Recalculate totals
    const newSubtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = Math.max(0, newSubtotal - discountAmount);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon applied successfully",
        data: {
          coupon: {
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            discount: coupon.discount,
            discountAmount: discountAmount,
          },
          cart: {
            itemCount: itemCount,
            subtotal: newSubtotal,
            discount: discountAmount,
            total: total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Apply coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to apply coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}


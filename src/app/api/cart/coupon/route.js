import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import { authenticateUser } from "@/lib/auth";

/**
 * DELETE /api/cart/coupon
 * Remove applied coupon from cart
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

    // Check if coupon is applied
    if (!cart.coupon || !cart.coupon.code) {
      return NextResponse.json(
        {
          success: false,
          message: "No coupon applied to cart",
          errors: [
            {
              field: "coupon",
              message: "There is no coupon applied to your cart",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Store coupon code for response
    const removedCouponCode = cart.coupon.code;

    // Remove coupon from cart
    await cart.removeCoupon();

    // Recalculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal; // No discount after removing coupon
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon removed successfully",
        data: {
          message: `Coupon "${removedCouponCode}" has been removed from cart`,
          removedCoupon: {
            code: removedCouponCode,
          },
          cart: {
            itemCount: itemCount,
            subtotal: subtotal,
            discount: 0,
            total: total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to remove coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}


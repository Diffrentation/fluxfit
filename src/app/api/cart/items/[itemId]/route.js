import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/cart/items/:itemId
 * Update cart item quantity
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get item ID from params
    const { itemId } = await params;

    // Validate item ID
    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
          errors: [
            {
              field: "itemId",
              message: "Item ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item ID format",
          errors: [
            {
              field: "itemId",
              message: "Item ID must be a valid ObjectId",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { quantity } = body;

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity is required",
          errors: [
            {
              field: "quantity",
              message: "Quantity is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (isNaN(quantity) || quantity < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a number greater than or equal to 0",
          errors: [
            {
              field: "quantity",
              message: "Quantity must be a number greater than or equal to 0",
            },
          ],
        },
        { status: 400 }
      );
    }

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

    // Find the item in cart
    const item = cart.items.id(itemId);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found",
        },
        { status: 404 }
      );
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await cart.removeItem(itemId);

      // Reload cart to get updated items
      await cart.populate({
        path: "items.product",
        select: "name slug images basePrice originalPrice inStock stock",
      });

      // Recalculate totals
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
      const itemCount = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      return NextResponse.json(
        {
          success: true,
          message: "Item removed from cart successfully",
          data: {
            itemId: itemId,
            cart: {
              itemCount: itemCount,
              subtotal: subtotal,
              total: total,
            },
          },
        },
        { status: 200 }
      );
    }

    // Check stock availability if quantity is being increased
    const currentQuantity = item.quantity;
    if (quantity > currentQuantity) {
      // Find product to check stock
      const product = await Product.findById(item.product).lean();

      if (!product || product.isDeleted || product.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: "Product is no longer available",
          },
          { status: 400 }
        );
      }

      // Check variant stock if variant exists
      let availableStock = product.stock;
      if (item.variant.size || item.variant.color) {
        const matchingVariant = product.variants.find(
          (v) =>
            v.size === (item.variant.size || null) &&
            v.color === (item.variant.color || null) &&
            v.isActive !== false
        );

        if (matchingVariant) {
          availableStock = matchingVariant.stock || 0;
        } else {
          return NextResponse.json(
            {
              success: false,
              message: "Product variant is no longer available",
            },
            { status: 400 }
          );
        }
      }

      if (availableStock < quantity) {
        return NextResponse.json(
          {
            success: false,
            message: "Insufficient stock",
            errors: [
              {
                field: "quantity",
                message: `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Update item quantity
    await cart.updateItemQuantity(itemId, quantity);

    // Reload cart with populated product
    await cart.populate({
      path: "items.product",
      select: "name slug images basePrice originalPrice inStock stock",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    // Find updated item
    const updatedItem = cart.items.id(itemId);

    // Format item
    const product = updatedItem.product;
    const primaryImage =
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      null;

    // Calculate cart totals
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
        message: "Cart item updated successfully",
        data: {
          item: {
            id: updatedItem._id,
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
              size: updatedItem.variant.size || null,
              color: updatedItem.variant.color || null,
            },
            customization: updatedItem.customization || null,
            quantity: updatedItem.quantity,
            price: updatedItem.price,
            subtotal: updatedItem.price * updatedItem.quantity,
            addedAt: updatedItem.addedAt,
          },
          cart: {
            itemCount: itemCount,
            subtotal: subtotal,
            total: total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to update cart item. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get item ID from params
    const { itemId } = await params;

    // Validate item ID
    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
          errors: [
            {
              field: "itemId",
              message: "Item ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item ID format",
          errors: [
            {
              field: "itemId",
              message: "Item ID must be a valid ObjectId",
            },
          ],
        },
        { status: 400 }
      );
    }

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

    // Find the item in cart
    const item = cart.items.id(itemId);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found",
        },
        { status: 404 }
      );
    }

    // Remove item from cart
    await cart.removeItem(itemId);

    // Recalculate totals
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
        message: "Item removed from cart successfully",
        data: {
          itemId: itemId,
          cart: {
            itemCount: itemCount,
            subtotal: subtotal,
            total: total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to remove item from cart. Please try again.",
      },
      { status: 500 }
    );
  }
}


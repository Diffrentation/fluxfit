import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/cart/items
 * Add item to cart
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
    const { productId, variant = {}, quantity = 1 } = body;

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

    if (quantity === undefined || quantity === null) {
      errors.push({
        field: "quantity",
        message: "Quantity is required",
      });
    } else if (isNaN(quantity) || quantity < 1) {
      errors.push({
        field: "quantity",
        message: "Quantity must be a number greater than 0",
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
      status: "active",
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or not available",
        },
        { status: 404 }
      );
    }

    // Check if product is in stock
    if (!product.inStock) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is out of stock",
          errors: [
            {
              field: "product",
              message: "This product is currently out of stock",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Determine price based on variant or base price
    let itemPrice = product.basePrice;

    // If variant is specified, find matching variant
    if (variant.size || variant.color) {
      const matchingVariant = product.variants.find((v) => {
        const sizeMatch = !variant.size || v.size === variant.size;
        const colorMatch = !variant.color || v.color === variant.color;
        return sizeMatch && colorMatch && v.isActive !== false;
      });

      if (matchingVariant) {
        itemPrice = matchingVariant.price;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Product variant not found or not available",
            errors: [
              {
                field: "variant",
                message: `Variant with size "${variant.size || "N/A"}" and color "${variant.color || "N/A"}" not found`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Check stock availability
    const availableStock = variant.size || variant.color
      ? product.variants.find(
          (v) =>
            (!variant.size || v.size === variant.size) &&
            (!variant.color || v.color === variant.color) &&
            v.isActive !== false
        )?.stock || 0
      : product.stock;

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

    // Get or create cart
    const cart = await Cart.getOrCreate(user._id);

    // Add item to cart
    await cart.addItem(productId, variant, quantity, itemPrice);

    // Populate cart with product details
    await cart.populate({
      path: "items.product",
      select: "name slug images basePrice originalPrice inStock stock",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    // Find the added item
    const addedItem = cart.items.find(
      (item) =>
        item.product._id.toString() === productId.toString() &&
        item.variant.size === (variant.size || null) &&
        item.variant.color === (variant.color || null)
    );

    // Format response
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

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart successfully",
        data: {
          item: {
            id: addedItem._id,
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
              size: addedItem.variant.size || null,
              color: addedItem.variant.color || null,
            },
            quantity: addedItem.quantity,
            price: addedItem.price,
            subtotal: addedItem.price * addedItem.quantity,
            addedAt: addedItem.addedAt,
          },
          cart: {
            itemCount: itemCount,
            subtotal: subtotal,
            total: total,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add item to cart error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to add item to cart. Please try again.",
      },
      { status: 500 }
    );
  }
}


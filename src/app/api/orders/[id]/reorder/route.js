import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/orders/:id/reorder
 * Reorder items from a previous order
 */
export async function POST(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get order ID or order number from params
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID or order number is required",
          errors: [
            {
              field: "id",
              message: "Order ID or order number is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    let body = {};
    try {
      const text = await request.text();
      if (text?.trim()) body = JSON.parse(text);
    } catch {
      body = {};
    }
    const { itemIds } = body || {};

    // Build query - try as ObjectId first, then as order number
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, user: user._id };
    } else {
      query = { orderNumber: id, user: user._id };
    }

    // Find order
    const order = await Order.findOne(query).populate("items.product");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Filter items to reorder
    let itemsToReorder = order.items;
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      // Validate item IDs
      const validItemIds = itemIds.filter((itemId) =>
        mongoose.Types.ObjectId.isValid(itemId)
      );
      itemsToReorder = order.items.filter((item) =>
        validItemIds.includes(item._id.toString())
      );

      if (itemsToReorder.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No valid items found to reorder",
            errors: [
              {
                field: "itemIds",
                message: "No valid items found with the provided IDs",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Get or create cart
    const cart = await Cart.getOrCreate(user._id);

    // Validate and add items to cart
    const addedItems = [];
    const failedItems = [];
    const errors = [];

    for (const orderItem of itemsToReorder) {
      const product = orderItem.product;

      // Check if product exists and is available
      if (!product || product.isDeleted || product.status !== "active") {
        failedItems.push({
          productName: orderItem.productName,
          reason: "Product is no longer available",
        });
        continue;
      }

      // Check if product is in stock
      if (!product.inStock) {
        failedItems.push({
          productName: orderItem.productName,
          reason: "Product is out of stock",
        });
        continue;
      }

      // Determine price and stock based on variant
      let itemPrice = product.basePrice;
      let availableStock = product.stock;
      let variant = null;

      if (orderItem.variant.size || orderItem.variant.color) {
        variant = product.variants.find(
          (v) =>
            v.size === (orderItem.variant.size || null) &&
            v.color === (orderItem.variant.color || null) &&
            v.isActive !== false
        );

        if (!variant) {
          failedItems.push({
            productName: orderItem.productName,
            reason: "Variant is no longer available",
          });
          continue;
        }

        itemPrice = variant.price;
        availableStock = variant.stock || 0;
      }

      // Check stock availability
      if (availableStock < orderItem.quantity) {
        failedItems.push({
          productName: orderItem.productName,
          reason: `Only ${availableStock} item${
            availableStock === 1 ? "" : "s"
          } available in stock`,
        });
        continue;
      }

      // Add item to cart
      try {
        await cart.addItem(
          product._id,
          {
            size: orderItem.variant.size || null,
            color: orderItem.variant.color || null,
          },
          orderItem.quantity,
          itemPrice,
          orderItem.customization ?? null
        );

        addedItems.push({
          productName: orderItem.productName,
          quantity: orderItem.quantity,
          price: itemPrice,
        });
      } catch (error) {
        failedItems.push({
          productName: orderItem.productName,
          reason: error.message || "Failed to add to cart",
        });
      }
    }

    // Reload cart with populated products
    await cart.populate({
      path: "items.product",
      select:
        "name slug images basePrice originalPrice inStock stock category brand",
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
        message: "Items added to cart successfully",
        data: {
          addedItems: addedItems,
          failedItems: failedItems.length > 0 ? failedItems : null,
          cart: {
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
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to reorder items. Please try again.",
      },
      { status: 500 }
    );
  }
}

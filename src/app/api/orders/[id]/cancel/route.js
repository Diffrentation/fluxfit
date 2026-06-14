import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/orders/:id/cancel
 * Cancel order
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

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Cancellation reason is required",
          errors: [
            {
              field: "reason",
              message: "Please provide a reason for cancellation",
            },
          ],
        },
        { status: 400 }
      );
    }

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

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be cancelled. Current status: ${order.status}`,
          errors: [
            {
              field: "order",
              message: `Orders with status "${order.status}" cannot be cancelled. Only pending, confirmed, or processing orders can be cancelled.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check if order is already cancelled
    if (order.cancellation.requested) {
      return NextResponse.json(
        {
          success: false,
          message: "Order is already cancelled",
          errors: [
            {
              field: "order",
              message: "This order has already been cancelled",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Restore product stock
    for (const item of order.items) {
      const product = item.product;
      if (product) {
        // Find variant if exists
        if (item.variant.size || item.variant.color) {
          const variant = product.variants.find(
            (v) =>
              (v.size || null) === (item.variant.size || null) &&
              (v.color || null) === (item.variant.color || null)
          );

          if (variant) {
            variant.stock += item.quantity;
            variant.isActive = true;
          }

          // Re-calculate main product stock to bypass save hooks safely
          product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
          product.inStock = product.stock > 0 || product.variants.some(v => v.stock > 0 && v.isActive !== false);

        } else {
          product.stock += item.quantity;
          product.inStock = product.stock > 0;
        }

        // Use updateOne to bypass save hooks safely
        const ProductModel = mongoose.models.Product || (await import("@/models/product.model")).default;
        await ProductModel.updateOne(
          { _id: product._id },
          { 
            $set: { 
              stock: product.stock, 
              variants: product.variants, 
              inStock: product.inStock 
            } 
          }
        );
      }
    }

    // Cancel order
    order.cancel(reason.trim(), user._id);
    await order.save();

    // Populate order for response
    await order.populate({
      path: "items.product",
      select: "name slug images",
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

    // Format order items for response
    const formattedOrderItems = order.items.map((item) => {
      const product = item.product;
      const primaryImage =
        product?.images?.find((img) => img.isPrimary)?.url ||
        product?.images?.[0]?.url ||
        item.productImage ||
        null;

      return {
        id: item._id,
        product: {
          id: product?._id || null,
          name: item.productName,
          slug: product?.slug || null,
          image: primaryImage,
          category: product?.category
            ? {
                id: product.category._id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          brand: product?.brand
            ? {
                id: product.brand._id,
                name: product.brand.name,
                logo: product.brand.logo || null,
              }
            : null,
        },
        variant: {
          size: item.variant.size || null,
          color: item.variant.color || null,
          sku: item.variant.sku || null,
        },
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        status: item.status,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            items: formattedOrderItems,
            status: order.status,
            cancellation: {
              requested: order.cancellation.requested,
              reason: order.cancellation.reason,
              cancelledAt: order.cancellation.cancelledAt,
            },
            statusHistory: order.statusHistory,
            updatedAt: order.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to cancel order. Please try again.",
      },
      { status: 500 }
    );
  }
}


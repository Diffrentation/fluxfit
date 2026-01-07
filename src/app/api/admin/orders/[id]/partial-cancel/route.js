import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/admin/orders/:id/partial-cancel
 * Partial cancel order items (Admin)
 * 
 * Request Body:
 * - itemIds: Array of item IDs to cancel (required)
 * - reason: Cancellation reason (required)
 */
export async function POST(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
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
    const { itemIds, reason } = body;

    // Validate itemIds
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Item IDs are required",
          errors: [
            {
              field: "itemIds",
              message: "Please provide at least one item ID to cancel",
            },
          ],
        },
        { status: 400 }
      );
    }

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
    // Admin can cancel any order, so no user filter
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
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

    // Check if order can be partially cancelled
    const cancellableStatuses = ["pending", "confirmed", "processing", "shipped"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be partially cancelled. Current status: ${order.status}`,
          errors: [
            {
              field: "order",
              message: `Orders with status "${order.status}" cannot be partially cancelled. Only pending, confirmed, processing, or shipped orders can be partially cancelled.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate item IDs and find items to cancel
    const errors = [];
    const itemsToCancel = [];
    const validItemIds = itemIds.filter((itemId) =>
      mongoose.Types.ObjectId.isValid(itemId)
    );

    if (validItemIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item IDs",
          errors: [
            {
              field: "itemIds",
              message: "All item IDs must be valid MongoDB ObjectIds",
            },
          ],
        },
        { status: 400 }
      );
    }

    for (const itemId of validItemIds) {
      const item = order.items.id(itemId);
      if (!item) {
        errors.push({
          field: "itemIds",
          message: `Item with ID ${itemId} not found in order`,
        });
      } else if (item.status === "cancelled" || item.status === "refunded") {
        errors.push({
          field: "itemIds",
          message: `Item "${item.productName}" is already ${item.status}`,
        });
      } else {
        itemsToCancel.push(item);
      }
    }

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

    // Check if trying to cancel all items (should use full cancel instead)
    if (itemsToCancel.length === order.items.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot cancel all items. Use full order cancellation instead.",
          errors: [
            {
              field: "itemIds",
              message: "To cancel all items, use the full order cancellation endpoint",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Restore product stock for cancelled items
    const cancelledItems = [];
    for (const item of itemsToCancel) {
      const product = item.product;
      if (product) {
        // Find variant if exists
        if (item.variant.size || item.variant.color) {
          const variant = product.variants.find(
            (v) =>
              v.size === (item.variant.size || null) &&
              v.color === (item.variant.color || null)
          );

          if (variant) {
            variant.stock += item.quantity;
            variant.isActive = variant.stock > 0;
          }
        } else {
          product.stock += item.quantity;
          product.inStock = product.stock > 0;
        }

        await product.save();

        // Mark item as cancelled
        item.status = "cancelled";
        cancelledItems.push({
          id: item._id,
          productName: item.productName,
          quantity: item.quantity,
          total: item.total,
        });
      }
    }

    // Recalculate order totals
    order.calculateTotals();

    // Add status history entry
    const cancelledItemNames = cancelledItems.map((item) => item.productName).join(", ");
    order.updateStatus(
      order.status,
      `Partially cancelled: ${cancelledItems.length} item(s) cancelled (${cancelledItemNames}). Reason: ${reason.trim()}`,
      user._id
    );

    // Save order
    await order.save();

    // Populate order for response
    await order.populate({
      path: "user",
      select: "firstname lastname email phone",
    });
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
        originalPrice: item.originalPrice || null,
        discount: item.discount || 0,
        total: item.total,
        status: item.status,
      };
    });

    // Calculate cancelled total
    const cancelledTotal = cancelledItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order items cancelled successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            user: order.user
              ? {
                  id: order.user._id,
                  name: `${order.user.firstname} ${order.user.lastname}`,
                  email: order.user.email,
                  phone: order.user.phone || null,
                }
              : null,
            items: formattedOrderItems,
            itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: order.subtotal,
            discount: order.discount,
            shipping: {
              method: order.shipping.method,
              cost: order.shipping.cost,
            },
            tax: {
              gst: order.tax.gst || 0,
              total: order.tax.total || 0,
            },
            total: order.total,
            status: order.status,
            statusHistory: order.statusHistory || [],
            updatedAt: order.updatedAt,
          },
          cancelledItems: cancelledItems,
          cancelledTotal: cancelledTotal,
          remainingItems: order.items.filter(
            (item) => item.status !== "cancelled"
          ).length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin partial cancel order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to partially cancel order. Please try again.",
      },
      { status: 500 }
    );
  }
}


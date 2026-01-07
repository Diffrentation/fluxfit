import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/orders/:id/return
 * Request return for order or specific items
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
    const { id } = params;

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

    // Validate reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Return reason is required",
          errors: [
            {
              field: "reason",
              message: "Please provide a reason for return",
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

    // Check if order can be returned
    if (order.status !== "delivered") {
      return NextResponse.json(
        {
          success: false,
          message: "Order must be delivered before requesting return",
          errors: [
            {
              field: "order",
              message: `Orders with status "${order.status}" cannot be returned. Only delivered orders can be returned.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate item IDs if provided
    const errors = [];
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      for (const itemId of itemIds) {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          errors.push({
            field: "itemIds",
            message: `Invalid item ID format: ${itemId}`,
          });
        } else {
          const item = order.items.id(itemId);
          if (!item) {
            errors.push({
              field: "itemIds",
              message: `Item with ID ${itemId} not found in order`,
            });
          } else if (item.returnRequested) {
            errors.push({
              field: "itemIds",
              message: `Item "${item.productName}" has already been requested for return`,
            });
          } else if (item.status === "returned" || item.status === "refunded") {
            errors.push({
              field: "itemIds",
              message: `Item "${item.productName}" has already been ${item.status}`,
            });
          }
        }
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

    // Process return request
    const returnedItems = [];

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      // Return specific items
      for (const itemId of itemIds) {
        const item = order.items.id(itemId);
        if (item && !item.returnRequested) {
          order.requestReturn(itemId, reason.trim());
          returnedItems.push({
            id: item._id,
            productName: item.productName,
            quantity: item.quantity,
            status: item.status,
          });
        }
      }

      // Update order status if all items are returned
      const allItemsReturned = order.items.every(
        (item) => item.returnRequested || item.status === "returned"
      );
      if (allItemsReturned) {
        order.updateStatus("returned", "All items returned", user._id);
      }
    } else {
      // Return entire order
      for (const item of order.items) {
        if (!item.returnRequested) {
          order.requestReturn(item._id, reason.trim());
          returnedItems.push({
            id: item._id,
            productName: item.productName,
            quantity: item.quantity,
            status: item.status,
          });
        }
      }

      // Update order status
      order.updateStatus("returned", `Order return requested: ${reason.trim()}`, user._id);
    }

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
        returnRequested: item.returnRequested,
        returnReason: item.returnReason,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Return request submitted successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            items: formattedOrderItems,
            status: order.status,
            statusHistory: order.statusHistory,
            updatedAt: order.updatedAt,
          },
          returnedItems: returnedItems,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request return error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to request return. Please try again.",
      },
      { status: 500 }
    );
  }
}


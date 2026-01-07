import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/orders/:id/refund
 * Request refund for order or specific items
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
          message: "Refund reason is required",
          errors: [
            {
              field: "reason",
              message: "Please provide a reason for refund",
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

    // Check if order can be refunded
    const refundableStatuses = ["delivered", "returned", "cancelled"];
    if (!refundableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Order cannot be refunded at this stage",
          errors: [
            {
              field: "order",
              message: `Orders with status "${order.status}" cannot be refunded. Only delivered, returned, or cancelled orders can be refunded.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check payment status
    if (order.payment.status === "refunded") {
      return NextResponse.json(
        {
          success: false,
          message: "Order has already been refunded",
          errors: [
            {
              field: "order",
              message: "This order has already been refunded",
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
          } else if (item.refundRequested) {
            errors.push({
              field: "itemIds",
              message: `Item "${item.productName}" has already been requested for refund`,
            });
          } else if (item.status === "refunded") {
            errors.push({
              field: "itemIds",
              message: `Item "${item.productName}" has already been refunded`,
            });
          } else if (
            !item.returnRequested &&
            order.status !== "cancelled"
          ) {
            errors.push({
              field: "itemIds",
              message: `Item "${item.productName}" must be returned before requesting refund`,
            });
          }
        }
      }
    } else {
      // Check if all items are returned (for full order refund)
      if (order.status !== "cancelled") {
        const allItemsReturned = order.items.every(
          (item) => item.returnRequested || item.status === "returned"
        );
        if (!allItemsReturned) {
          errors.push({
            field: "order",
            message: "All items must be returned before requesting refund",
          });
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

    // Process refund request
    const refundedItems = [];
    let totalRefundAmount = 0;

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      // Refund specific items
      for (const itemId of itemIds) {
        const item = order.items.id(itemId);
        if (item && !item.refundRequested) {
          // Mark item for refund
          item.refundRequested = true;
          item.refundReason = reason.trim();
          item.status = "refunded";
          totalRefundAmount += item.total;

          refundedItems.push({
            id: item._id,
            productName: item.productName,
            quantity: item.quantity,
            amount: item.total,
            status: item.status,
          });
        }
      }

      // Update order status if all items are refunded
      const allItemsRefunded = order.items.every(
        (item) => item.refundRequested || item.status === "refunded"
      );
      if (allItemsRefunded) {
        order.processRefund();
      } else {
        // Update status history
        order.updateStatus(
          order.status,
          `Refund requested for ${refundedItems.length} item(s): ${reason.trim()}`,
          user._id
        );
      }
    } else {
      // Refund entire order
      for (const item of order.items) {
        if (!item.refundRequested) {
          item.refundRequested = true;
          item.refundReason = reason.trim();
          item.status = "refunded";
          totalRefundAmount += item.total;

          refundedItems.push({
            id: item._id,
            productName: item.productName,
            quantity: item.quantity,
            amount: item.total,
            status: item.status,
          });
        }
      }

      // Process full order refund
      order.processRefund();
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
        refundRequested: item.refundRequested,
        refundReason: item.refundReason,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Refund request submitted successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            items: formattedOrderItems,
            status: order.status,
            payment: {
              status: order.payment.status,
            },
            statusHistory: order.statusHistory,
            updatedAt: order.updatedAt,
          },
          refundedItems: refundedItems,
          totalRefundAmount: totalRefundAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request refund error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to request refund. Please try again.",
      },
      { status: 500 }
    );
  }
}


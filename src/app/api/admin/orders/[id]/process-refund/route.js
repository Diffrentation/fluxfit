import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/admin/orders/:id/process-refund
 * Process refund (Admin)
 * 
 * Request Body:
 * - itemIds: Array of item IDs to refund (optional, if not provided, refunds entire order)
 * - amount: Refund amount (optional, if not provided, uses item/order total)
 * - note: Optional note for refund processing
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
    const { itemIds, amount, note } = body;

    // Build query - try as ObjectId first, then as order number
    // Admin can process refunds for any order
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

    // Check if order can be refunded
    const refundableStatuses = ["delivered", "returned", "cancelled"];
    if (!refundableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be refunded. Current status: ${order.status}`,
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

    // Process refund
    const refundedItems = [];
    let totalRefundAmount = 0;

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      // Validate item IDs
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

      // Refund specific items
      for (const itemId of validItemIds) {
        const item = order.items.id(itemId);
        if (!item) {
          return NextResponse.json(
            {
              success: false,
              message: `Item with ID ${itemId} not found in order`,
              errors: [
                {
                  field: "itemIds",
                  message: `Item with ID ${itemId} not found`,
                },
              ],
            },
            { status: 400 }
          );
        }

        if (item.status === "refunded") {
          return NextResponse.json(
            {
              success: false,
              message: `Item "${item.productName}" has already been refunded`,
              errors: [
                {
                  field: "itemIds",
                  message: `Item "${item.productName}" is already refunded`,
                },
              ],
            },
            { status: 400 }
          );
        }

        // Check if item is returned (for refund eligibility)
        if (!item.returnRequested && order.status !== "cancelled") {
          return NextResponse.json(
            {
              success: false,
              message: `Item "${item.productName}" must be returned before refund`,
              errors: [
                {
                  field: "itemIds",
                  message: `Item "${item.productName}" must be returned before processing refund`,
                },
              ],
            },
            { status: 400 }
          );
        }

        // Process refund for item
        const refundAmount = amount && itemIds.length === 1 ? amount : item.total;
        order.processRefund(itemId, refundAmount);
        totalRefundAmount += refundAmount;

        refundedItems.push({
          id: item._id,
          productName: item.productName,
          quantity: item.quantity,
          amount: refundAmount,
          status: item.status,
        });
      }

      // Check if all items are refunded
      const allItemsRefunded = order.items.every(
        (item) => item.status === "refunded" || item.refundRequested
      );
      if (allItemsRefunded) {
        order.payment.status = "refunded";
      }

      // Update status history
      const refundNote = note || `Refund processed for ${refundedItems.length} item(s) by admin`;
      order.updateStatus(
        order.status,
        refundNote,
        user._id
      );
    } else {
      // Refund entire order
      // Check if all items are returned (for refund eligibility)
      if (order.status !== "cancelled") {
        const allItemsReturned = order.items.every(
          (item) => item.returnRequested || item.status === "returned"
        );
        if (!allItemsReturned) {
          return NextResponse.json(
            {
              success: false,
              message: "All items must be returned before processing refund",
              errors: [
                {
                  field: "order",
                  message: "All items must be returned before processing full order refund",
                },
              ],
            },
            { status: 400 }
          );
        }
      }

      // Process full order refund
      const refundAmount = amount || order.total;
      order.processRefund(null, refundAmount);
      totalRefundAmount = refundAmount;

      // Mark all items as refunded
      for (const item of order.items) {
        if (item.status !== "refunded") {
          item.refundRequested = true;
          item.status = "refunded";
          refundedItems.push({
            id: item._id,
            productName: item.productName,
            quantity: item.quantity,
            amount: item.total,
            status: item.status,
          });
        }
      }

      // Update status history
      const refundNote = note || `Full order refund processed by admin`;
      order.updateStatus("refunded", refundNote, user._id);
    }

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
        refundRequested: item.refundRequested,
        refundReason: item.refundReason,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Refund processed successfully",
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
            payment: {
              method: order.payment.method,
              status: order.payment.status,
              transactionId: order.payment.transactionId || null,
              paymentId: order.payment.paymentId || null,
              paidAt: order.payment.paidAt || null,
            },
            status: order.status,
            statusHistory: order.statusHistory || [],
            updatedAt: order.updatedAt,
          },
          refundedItems: refundedItems,
          totalRefundAmount: totalRefundAmount,
          refundedCount: refundedItems.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Process refund error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process refund. Please try again.",
      },
      { status: 500 }
    );
  }
}


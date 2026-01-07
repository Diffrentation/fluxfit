import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/orders/:id/status
 * Update order status (Admin)
 * 
 * Request Body:
 * - status: New order status (required)
 * - note: Optional note for status change
 */
export async function PUT(request, { params }) {
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
    const { status, note } = body;

    // Validate status
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message: "Status is required",
          errors: [
            {
              field: "status",
              message: "Order status is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
      "refunded",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
          errors: [
            {
              field: "status",
              message: `Status must be one of: ${validStatuses.join(", ")}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as order number
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    // Find order
    const order = await Order.findOne(query);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Check if status is already set
    if (order.status === status) {
      return NextResponse.json(
        {
          success: false,
          message: `Order is already in "${status}" status`,
          errors: [
            {
              field: "status",
              message: `Order status is already "${status}"`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate status transition (basic validation)
    const statusFlow = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["returned", "refunded"],
      cancelled: ["refunded"],
      returned: ["refunded"],
      refunded: [],
    };

    const allowedTransitions = statusFlow[order.status] || [];
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change status from "${order.status}" to "${status}"`,
          errors: [
            {
              field: "status",
              message: `Invalid status transition. Allowed transitions from "${order.status}": ${allowedTransitions.join(", ")}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Store previous status before update
    const previousStatus = order.status;

    // Update order status
    const statusNote = note || `Status updated from "${previousStatus}" to "${status}" by admin`;
    order.updateStatus(status, statusNote, user._id);

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
    const formattedItems = order.items.map((item) => {
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

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully",
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
            items: formattedItems,
            previousStatus: previousStatus,
            status: order.status,
            statusHistory: order.statusHistory.map((entry) => ({
              status: entry.status,
              timestamp: entry.timestamp,
              note: entry.note,
              updatedBy: entry.updatedBy || null,
            })),
            delivery: {
              partner: order.delivery.partner || null,
              trackingNumber: order.delivery.trackingNumber || null,
              estimatedDelivery: order.delivery.estimatedDelivery || null,
              deliveredAt: order.delivery.deliveredAt || null,
            },
            updatedAt: order.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update order status. Please try again.",
      },
      { status: 500 }
    );
  }
}


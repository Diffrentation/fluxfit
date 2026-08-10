import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { sendOrderStatusUpdateSMS } from "@/lib/sms";
import mongoose from "mongoose";

/**
 * POST /api/admin/orders/:id/cancel
 * Cancel order (Admin)
 * 
 * Request Body:
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

    // Check if order can be cancelled (admin can cancel more statuses than users)
    const cancellableStatuses = ["pending", "confirmed", "processing", "shipped"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be cancelled. Current status: ${order.status}`,
          errors: [
            {
              field: "order",
              message: `Orders with status "${order.status}" cannot be cancelled. Only pending, confirmed, processing, or shipped orders can be cancelled.`,
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
      }
    }

    // Cancel order (admin cancellation)
    order.cancel(reason.trim(), user._id);
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

    // Notify the customer by email/SMS (best-effort, does not block the response)
    if (order.user?.email || order.user?.phone) {
      const note_ = `Order cancelled by admin. Reason: ${reason.trim()}`;
      if (order.user?.email) {
        sendOrderStatusUpdateEmail(order.user.email, {
          orderId: order.orderNumber,
          status: order.status,
          customerName: order.user.firstname
            ? `${order.user.firstname} ${order.user.lastname || ""}`.trim()
            : undefined,
          note: note_,
        }).catch((err) =>
          console.error("Failed to send admin-cancel email:", err)
        );
      }
      if (order.user?.phone) {
        sendOrderStatusUpdateSMS(order.user.phone, {
          orderId: order.orderNumber,
          status: order.status,
          note: note_,
        }).catch((err) =>
          console.error("Failed to send admin-cancel SMS:", err)
        );
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully",
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
            cancellation: {
              requested: order.cancellation.requested,
              reason: order.cancellation.reason,
              cancelledAt: order.cancellation.cancelledAt,
              cancelledBy: order.cancellation.cancelledBy || null,
            },
            statusHistory: order.statusHistory || [],
            updatedAt: order.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin cancel order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to cancel order. Please try again.",
      },
      { status: 500 }
    );
  }
}


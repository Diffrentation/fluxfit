import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/orders/:id/assign-delivery
 * Assign delivery partner to order (Admin)
 * 
 * Request Body:
 * - partner: Delivery partner name (required)
 * - trackingNumber: Tracking number (optional)
 * - estimatedDelivery: Estimated delivery date (ISO format, optional)
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
    const { partner, trackingNumber, estimatedDelivery } = body;

    // Validate partner
    if (!partner || !partner.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery partner is required",
          errors: [
            {
              field: "partner",
              message: "Delivery partner name is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate estimated delivery date if provided
    if (estimatedDelivery) {
      const deliveryDate = new Date(estimatedDelivery);
      if (isNaN(deliveryDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid estimated delivery date format",
            errors: [
              {
                field: "estimatedDelivery",
                message: "Estimated delivery date must be a valid ISO date string",
              },
            ],
          },
          { status: 400 }
        );
      }
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

    // Validate order status - can only assign delivery if order is confirmed, processing, or shipped
    const allowedStatuses = ["confirmed", "processing", "shipped"];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot assign delivery partner to order with status "${order.status}"`,
          errors: [
            {
              field: "order",
              message: `Delivery can only be assigned to orders with status: ${allowedStatuses.join(", ")}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update delivery information
    order.delivery.partner = partner.trim();
    if (trackingNumber) {
      order.delivery.trackingNumber = trackingNumber.trim();
    }
    if (estimatedDelivery) {
      order.delivery.estimatedDelivery = new Date(estimatedDelivery);
    }

    // If status is confirmed or processing, update to shipped when delivery is assigned
    if (order.status === "confirmed" || order.status === "processing") {
      const statusNote = `Delivery assigned to ${partner.trim()}${trackingNumber ? ` (Tracking: ${trackingNumber.trim()})` : ""}`;
      order.updateStatus("shipped", statusNote, user._id);
    } else {
      // Just add a note to status history
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Delivery assigned to ${partner.trim()}${trackingNumber ? ` (Tracking: ${trackingNumber.trim()})` : ""}`,
        updatedBy: user._id,
      });
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
        message: "Delivery partner assigned successfully",
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
            status: order.status,
            delivery: {
              partner: order.delivery.partner,
              trackingNumber: order.delivery.trackingNumber || null,
              estimatedDelivery: order.delivery.estimatedDelivery || null,
              deliveredAt: order.delivery.deliveredAt || null,
            },
            statusHistory: order.statusHistory
              .slice(-5)
              .map((entry) => ({
                status: entry.status,
                timestamp: entry.timestamp,
                note: entry.note,
                updatedBy: entry.updatedBy || null,
              })),
            updatedAt: order.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assign delivery error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to assign delivery partner. Please try again.",
      },
      { status: 500 }
    );
  }
}


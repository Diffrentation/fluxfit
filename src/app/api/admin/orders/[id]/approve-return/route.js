import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import mongoose from "mongoose";

/**
 * POST /api/admin/orders/:id/approve-return
 * Approve return request (Admin)
 * 
 * Request Body:
 * - itemIds: Array of item IDs to approve return (optional, if not provided, approves all requested returns)
 * - note: Optional note for approval
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
    const { itemIds, note } = body;

    // Build query - try as ObjectId first, then as order number
    // Admin can approve returns for any order
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    // Find order
    const order = await Order.findOne(query)
      .populate("items.product")
      .populate("user", "email firstname lastname phone");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Check if order has any return requests
    const itemsWithReturnRequest = order.items.filter(
      (item) => item.returnRequested && item.status === "returned"
    );

    if (itemsWithReturnRequest.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No return requests found for this order",
          errors: [
            {
              field: "order",
              message: "This order has no pending return requests",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Filter items to approve
    let itemsToApprove = itemsWithReturnRequest;
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

      itemsToApprove = itemsWithReturnRequest.filter((item) =>
        validItemIds.includes(item._id.toString())
      );

      if (itemsToApprove.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No matching return requests found for the provided item IDs",
            errors: [
              {
                field: "itemIds",
                message: "None of the provided item IDs have pending return requests",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Restore product stock for approved return items
    const approvedItems = [];
    for (const item of itemsToApprove) {
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

        approvedItems.push({
          id: item._id,
          productName: item.productName,
          quantity: item.quantity,
          total: item.total,
          returnReason: item.returnReason,
        });
      }
    }

    // Check if all items are now returned
    const allItemsReturned = order.items.every(
      (item) => item.status === "returned" || item.status === "refunded"
    );

    // Update order status if all items are returned
    if (allItemsReturned && order.status !== "returned") {
      order.updateStatus(
        "returned",
        `All items returned. Return approved by admin${note ? `: ${note.trim()}` : ""}`,
        user._id
      );
    } else {
      // Add status history entry for partial return approval
      const approvedItemNames = approvedItems
        .map((item) => item.productName)
        .join(", ");
      order.updateStatus(
        order.status,
        `Return approved for ${approvedItems.length} item(s) (${approvedItemNames})${note ? `: ${note.trim()}` : ""}`,
        user._id
      );
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
        returnRequested: item.returnRequested,
        returnReason: item.returnReason,
      };
    });

    // Notify the customer by email (best-effort, does not block the response)
    if (order.user?.email) {
      const approvedItemNames = approvedItems
        .map((item) => item.productName)
        .join(", ");
      sendOrderStatusUpdateEmail(order.user.email, {
        orderId: order.orderNumber,
        status: order.status,
        customerName: order.user.firstname
          ? `${order.user.firstname} ${order.user.lastname || ""}`.trim()
          : undefined,
        note: `Return approved for ${approvedItems.length} item(s) (${approvedItemNames})${note ? `: ${note.trim()}` : ""}`,
      }).catch((err) =>
        console.error("Failed to send approve-return email:", err)
      );
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Return request approved successfully",
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
            status: order.status,
            statusHistory: order.statusHistory || [],
            updatedAt: order.updatedAt,
          },
          approvedItems: approvedItems,
          approvedCount: approvedItems.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve return error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to approve return. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/admin/orders/:id/reject-return
 * Reject return request (Admin)
 * 
 * Request Body:
 * - itemIds: Array of item IDs to reject return (optional, if not provided, rejects all requested returns)
 * - reason: Rejection reason (required)
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

    // Validate reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required",
          errors: [
            {
              field: "reason",
              message: "Please provide a reason for rejecting the return",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as order number
    // Admin can reject returns for any order
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

    // Filter items to reject
    let itemsToReject = itemsWithReturnRequest;
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

      itemsToReject = itemsWithReturnRequest.filter((item) =>
        validItemIds.includes(item._id.toString())
      );

      if (itemsToReject.length === 0) {
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

    // Reject return requests
    const rejectedItems = [];
    for (const item of itemsToReject) {
      // Reset return request
      item.returnRequested = false;
      // Change status back to delivered
      item.status = "delivered";
      // Keep returnReason for record, but we'll note the rejection in status history

      rejectedItems.push({
        id: item._id,
        productName: item.productName,
        quantity: item.quantity,
        returnReason: item.returnReason,
      });
    }

    // Add status history entry
    const rejectedItemNames = rejectedItems
      .map((item) => item.productName)
      .join(", ");
    order.updateStatus(
      order.status,
      `Return rejected for ${rejectedItems.length} item(s) (${rejectedItemNames}). Reason: ${reason.trim()}`,
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
        returnRequested: item.returnRequested,
        returnReason: item.returnReason,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Return request rejected successfully",
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
          rejectedItems: rejectedItems,
          rejectedCount: rejectedItems.length,
          rejectionReason: reason.trim(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject return error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to reject return. Please try again.",
      },
      { status: 500 }
    );
  }
}


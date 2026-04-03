import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import "@/models/category.model";
import "@/models/brand.model";
import { authenticateUser } from "@/lib/auth";
import { isStrictMongoObjectIdString } from "@/lib/mongoose-id";

/**
 * GET /api/orders/:id
 * Get order details by ID or order number
 */
export async function GET(request, { params }) {
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

    const idStr = decodeURIComponent(String(id).trim());

    let query;
    if (isStrictMongoObjectIdString(idStr)) {
      query = { _id: idStr, user: user._id };
    } else {
      query = { orderNumber: idStr, user: user._id };
    }

    console.log("[api/orders/:id] GET", {
      userId: String(user._id),
      ref: idStr,
      byId: isStrictMongoObjectIdString(idStr),
    });

    // Find order
    const order = await Order.findOne(query)
      .populate("items.product", "name slug images basePrice originalPrice category brand")
      .populate("items.product.category", "name slug")
      .populate("items.product.brand", "name logo")
      .lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Format order items
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
        returnRequested: item.returnRequested || false,
        returnReason: item.returnReason || null,
        refundRequested: item.refundRequested || false,
        refundReason: item.refundReason || null,
      };
    });

    // Format order
    const formattedOrder = {
      id: order._id,
      orderNumber: order.orderNumber,
      items: formattedItems,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      subtotal: order.subtotal,
      discount: order.discount,
      coupon: order.coupon.code
        ? {
            code: order.coupon.code,
            discount: order.coupon.discount,
            type: order.coupon.type,
          }
        : null,
      shipping: {
        method: order.shipping.method,
        cost: order.shipping.cost,
        estimatedDays: order.shipping.estimatedDays,
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
      delivery: {
        partner: order.delivery.partner || null,
        trackingNumber: order.delivery.trackingNumber || null,
        estimatedDelivery: order.delivery.estimatedDelivery || null,
        deliveredAt: order.delivery.deliveredAt || null,
      },
      cancellation: order.cancellation.requested
        ? {
            requested: true,
            reason: order.cancellation.reason,
            cancelledAt: order.cancellation.cancelledAt,
            cancelledBy: order.cancellation.cancelledBy || null,
          }
        : null,
      notes: {
        customer: order.notes.customer || null,
        admin: order.notes.admin || null,
      },
      invoice: order.invoice.number
        ? {
            number: order.invoice.number,
            generatedAt: order.invoice.generatedAt,
            url: order.invoice.url || null,
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order retrieved successfully",
        data: {
          order: formattedOrder,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve order. Please try again.",
      },
      { status: 500 }
    );
  }
}


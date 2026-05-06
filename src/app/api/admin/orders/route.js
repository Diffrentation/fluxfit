import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/orders
 * Get all orders (with filters, pagination)
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by order status
 * - paymentStatus: Filter by payment status
 * - userId: Filter by user ID
 * - orderNumber: Filter by order number (exact match)
 * - startDate: Filter orders from this date (ISO format)
 * - endDate: Filter orders until this date (ISO format)
 * - minTotal: Minimum order total
 * - maxTotal: Maximum order total
 * - sort: Sort order - "newest" (default), "oldest", "total-asc", "total-desc"
 * - search: Search by order number or customer name/email
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const userId = searchParams.get("userId");
    const orderNumber = searchParams.get("orderNumber");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minTotal = searchParams.get("minTotal");
    const maxTotal = searchParams.get("maxTotal");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");

    // Build query
    const query = {};

    // Status filter
    if (status) {
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
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Payment status filter
    if (paymentStatus) {
      const validPaymentStatuses = [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ];
      if (validPaymentStatuses.includes(paymentStatus)) {
        query["payment.status"] = paymentStatus;
      }
    }

    // User ID filter
    if (userId) {
      query.user = userId;
    }

    // Order number filter (exact match)
    if (orderNumber) {
      query.orderNumber = orderNumber;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Total range filter
    if (minTotal || maxTotal) {
      query.total = {};
      if (minTotal) {
        query.total.$gte = parseFloat(minTotal);
      }
      if (maxTotal) {
        query.total.$lte = parseFloat(maxTotal);
      }
    }

    // Search filter (order number or customer name/email)
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "billingAddress.name": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "total-asc":
        sortObj.total = 1;
        break;
      case "total-desc":
        sortObj.total = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "firstname lastname email phone")
        .populate("items.product", "name slug images")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    console.log("[api/admin/orders] GET", {
      adminId: String(user._id),
      role: user.role,
      count: orders.length,
      total,
    });

    // Format orders for response
    const formattedOrders = orders.map((order) => {
      // Get primary image for each item
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
          customization: item.customization ?? null,
          returnRequested: item.returnRequested || false,
          refundRequested: item.refundRequested || false,
        };
      });

      return {
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
        invoice: order.invoice.number
          ? {
              number: order.invoice.number,
              generatedAt: order.invoice.generatedAt,
              url: order.invoice.url || null,
            }
          : null,
        notes: {
          customer: order.notes.customer || null,
          admin: order.notes.admin || null,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Orders retrieved successfully",
        orders: formattedOrders,
        data: {
          orders: formattedOrders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            status: status || null,
            paymentStatus: paymentStatus || null,
            userId: userId || null,
            orderNumber: orderNumber || null,
            startDate: startDate || null,
            endDate: endDate || null,
            minTotal: minTotal || null,
            maxTotal: maxTotal || null,
            search: search || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin orders error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve orders. Please try again.",
      },
      { status: 500 }
    );
  }
}

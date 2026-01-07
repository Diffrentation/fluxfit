import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/users/:id/orders
 * Get user's order history
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by order status (optional)
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
 * - sort: Sort order - "newest" (default), "oldest", "total-desc", "total-asc"
 */
export async function GET(request, { params }) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get user ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
          errors: [{ field: "id", message: "Valid user ID is required" }],
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(id).select("firstname lastname email");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const orderQuery = { user: id };

    if (status) {
      orderQuery.status = status;
    }

    if (startDate || endDate) {
      orderQuery.createdAt = {};
      if (startDate) {
        orderQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        orderQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "total-desc":
        sortObj.total = -1;
        break;
      case "total-asc":
        sortObj.total = 1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get orders and total count
    const [orders, total] = await Promise.all([
      Order.find(orderQuery)
        .populate("items.product", "name slug images")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(orderQuery),
    ]);

    // Format orders
    const formattedOrders = orders.map((order) => {
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
          price: Math.round(item.price * 100) / 100,
          total: Math.round(item.total * 100) / 100,
          status: item.status,
        };
      });

      return {
        id: order._id,
        orderNumber: order.orderNumber,
        items: formattedItems,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Math.round(order.subtotal * 100) / 100,
        discount: Math.round(order.discount * 100) / 100,
        shipping: {
          method: order.shipping.method,
          cost: Math.round(order.shipping.cost * 100) / 100,
        },
        tax: {
          gst: Math.round((order.tax.gst || 0) * 100) / 100,
          total: Math.round((order.tax.total || 0) * 100) / 100,
        },
        total: Math.round(order.total * 100) / 100,
        status: order.status,
        payment: {
          method: order.payment.method,
          status: order.payment.status,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    // Calculate summary statistics
    const summary = {
      totalOrders: total,
      totalSpent: Math.round(
        orders.reduce((sum, order) => sum + order.total, 0) * 100
      ) / 100,
      averageOrderValue:
        orders.length > 0
          ? Math.round(
              (orders.reduce((sum, order) => sum + order.total, 0) / orders.length) * 100
            ) / 100
          : 0,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "User orders retrieved successfully",
        data: {
          user: {
            id: user._id,
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
          },
          summary: summary,
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
            startDate: startDate || null,
            endDate: endDate || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user orders error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve user orders. Please try again.",
      },
      { status: 500 }
    );
  }
}


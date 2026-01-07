import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdmin } from "@/lib/auth";
import { generateCSV, generateCSVFilename } from "@/lib/csvGenerator";

/**
 * GET /api/admin/reports/orders
 * Generate orders report
 * 
 * Query Parameters:
 * - startDate: Start date (ISO format, required)
 * - endDate: End date (ISO format, required)
 * - format: Response format - "json" (default), "csv"
 * - status: Filter by order status (optional)
 * - paymentStatus: Filter by payment status (optional)
 * - includeItems: Include order items in response (true/false, default: false)
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const includeItems = searchParams.get("includeItems") === "true";

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date and end date are required",
          errors: [
            { field: "startDate", message: "Start date is required" },
            { field: "endDate", message: "End date is required" },
          ],
        },
        { status: 400 }
      );
    }

    const queryStartDate = new Date(startDate);
    const queryEndDate = new Date(endDate);

    if (isNaN(queryStartDate.getTime()) || isNaN(queryEndDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Please use ISO format (YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    // Build query
    const orderQuery = {
      createdAt: { $gte: queryStartDate, $lte: queryEndDate },
    };

    if (status) {
      orderQuery.status = status;
    }

    if (paymentStatus) {
      orderQuery["payment.status"] = paymentStatus;
    }

    // Get orders
    const orders = await Order.find(orderQuery)
      .populate("user", "firstname lastname email phone")
      .populate("items.product", "name slug category brand")
      .sort({ createdAt: -1 })
      .lean();

    // Format orders
    const formattedOrders = orders.map((order) => {
      const orderData = {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        customer: {
          name: order.user ? `${order.user.firstname} ${order.user.lastname}` : "N/A",
          email: order.user?.email || "N/A",
          phone: order.user?.phone || "N/A",
        },
        status: order.status,
        paymentStatus: order.payment.status,
        paymentMethod: order.payment.method,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Math.round(order.subtotal * 100) / 100,
        discount: Math.round(order.discount * 100) / 100,
        shipping: Math.round(order.shipping.cost * 100) / 100,
        tax: Math.round((order.tax.total || 0) * 100) / 100,
        total: Math.round(order.total * 100) / 100,
        coupon: order.coupon.code || null,
        shippingAddress: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        deliveryPartner: order.delivery.partner || null,
        trackingNumber: order.delivery.trackingNumber || null,
      };

      if (includeItems) {
        orderData.items = order.items.map((item) => ({
          productName: item.productName,
          variant: `${item.variant.size || ""} ${item.variant.color || ""}`.trim() || "N/A",
          quantity: item.quantity,
          price: Math.round(item.price * 100) / 100,
          total: Math.round(item.total * 100) / 100,
        }));
      }

      return orderData;
    });

    // Calculate summary statistics
    const summary = {
      totalOrders: orders.length,
      totalRevenue: Math.round(
        orders.reduce((sum, order) => sum + order.total, 0) * 100
      ) / 100,
      totalDiscount: Math.round(
        orders.reduce((sum, order) => sum + order.discount, 0) * 100
      ) / 100,
      totalItems: orders.reduce(
        (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
        0
      ),
      averageOrderValue: orders.length > 0
        ? Math.round(
            (orders.reduce((sum, order) => sum + order.total, 0) / orders.length) * 100
          ) / 100
        : 0,
      byStatus: {},
      byPaymentStatus: {},
    };

    // Calculate breakdowns
    orders.forEach((order) => {
      summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
      summary.byPaymentStatus[order.payment.status] =
        (summary.byPaymentStatus[order.payment.status] || 0) + 1;
    });

    // If CSV format requested
    if (format === "csv") {
      const headers = [
        { key: "orderNumber", label: "Order Number" },
        { key: "orderDate", label: "Order Date" },
        { key: "customer.name", label: "Customer Name" },
        { key: "customer.email", label: "Customer Email" },
        { key: "customer.phone", label: "Customer Phone" },
        { key: "status", label: "Status" },
        { key: "paymentStatus", label: "Payment Status" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "itemCount", label: "Item Count" },
        { key: "subtotal", label: "Subtotal" },
        { key: "discount", label: "Discount" },
        { key: "shipping", label: "Shipping" },
        { key: "tax", label: "Tax" },
        { key: "total", label: "Total" },
        { key: "coupon", label: "Coupon Code" },
        { key: "shippingAddress", label: "Shipping Address" },
        { key: "deliveryPartner", label: "Delivery Partner" },
        { key: "trackingNumber", label: "Tracking Number" },
      ];

      const csv = generateCSV(formattedOrders, headers);
      const filename = generateCSVFilename("orders-report");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Return JSON response
    return NextResponse.json(
      {
        success: true,
        message: "Orders report generated successfully",
        data: {
          period: {
            startDate: queryStartDate,
            endDate: queryEndDate,
          },
          summary: summary,
          orders: formattedOrders,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generate orders report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate orders report. Please try again.",
      },
      { status: 500 }
    );
  }
}


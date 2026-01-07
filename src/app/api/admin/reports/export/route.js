import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import { generateCSV, generateCSVFilename } from "@/lib/csvGenerator";

/**
 * GET /api/admin/reports/export
 * Export data (CSV/Excel)
 * 
 * Query Parameters:
 * - type: Data type to export - "orders", "products", "users", "sales" (required)
 * - format: Export format - "csv" (default), "json"
 * - startDate: Start date (ISO format, optional, required for orders/sales)
 * - endDate: End date (ISO format, optional, required for orders/sales)
 * - filters: JSON string of additional filters (optional)
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
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const filtersParam = searchParams.get("filters");

    // Validate type
    const validTypes = ["orders", "products", "users", "sales"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse filters if provided
    let filters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid filters JSON format",
          },
          { status: 400 }
        );
      }
    }

    let data = [];
    let headers = [];
    let filename = "";

    switch (type) {
      case "orders":
        if (!startDate || !endDate) {
          return NextResponse.json(
            {
              success: false,
              message: "Start date and end date are required for orders export",
            },
            { status: 400 }
          );
        }

        const orderQuery = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          ...filters,
        };

        const orders = await Order.find(orderQuery)
          .populate("user", "firstname lastname email phone")
          .lean();

        data = orders.map((order) => ({
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          customerName: order.user
            ? `${order.user.firstname} ${order.user.lastname}`
            : "N/A",
          customerEmail: order.user?.email || "N/A",
          customerPhone: order.user?.phone || "N/A",
          status: order.status,
          paymentStatus: order.payment.status,
          paymentMethod: order.payment.method,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: Math.round(order.subtotal * 100) / 100,
          discount: Math.round(order.discount * 100) / 100,
          shipping: Math.round(order.shipping.cost * 100) / 100,
          tax: Math.round((order.tax.total || 0) * 100) / 100,
          total: Math.round(order.total * 100) / 100,
          coupon: order.coupon.code || "",
          shippingCity: order.shippingAddress.city,
          shippingState: order.shippingAddress.state,
          shippingPincode: order.shippingAddress.pincode,
        }));

        headers = [
          { key: "orderNumber", label: "Order Number" },
          { key: "orderDate", label: "Order Date" },
          { key: "customerName", label: "Customer Name" },
          { key: "customerEmail", label: "Customer Email" },
          { key: "customerPhone", label: "Customer Phone" },
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
          { key: "shippingCity", label: "Shipping City" },
          { key: "shippingState", label: "Shipping State" },
          { key: "shippingPincode", label: "Shipping Pincode" },
        ];

        filename = generateCSVFilename("orders-export");
        break;

      case "products":
        const productQuery = { isDeleted: false, ...filters };
        const products = await Product.find(productQuery)
          .populate("category", "name")
          .populate("brand", "name")
          .lean();

        data = products.map((product) => ({
          name: product.name,
          sku: product.sku || "",
          basePrice: Math.round(product.basePrice * 100) / 100,
          originalPrice: product.originalPrice
            ? Math.round(product.originalPrice * 100) / 100
            : "",
          stock: product.stock || 0,
          inStock: product.inStock ? "Yes" : "No",
          status: product.status,
          category: product.category?.name || "",
          brand: product.brand?.name || "",
          description: product.description || "",
          createdAt: product.createdAt,
        }));

        headers = [
          { key: "name", label: "Product Name" },
          { key: "sku", label: "SKU" },
          { key: "basePrice", label: "Base Price" },
          { key: "originalPrice", label: "Original Price" },
          { key: "stock", label: "Stock" },
          { key: "inStock", label: "In Stock" },
          { key: "status", label: "Status" },
          { key: "category", label: "Category" },
          { key: "brand", label: "Brand" },
          { key: "description", label: "Description" },
          { key: "createdAt", label: "Created At" },
        ];

        filename = generateCSVFilename("products-export");
        break;

      case "users":
        const userQuery = { isdeleted: false, ...filters };
        const users = await User.find(userQuery).lean();

        data = users.map((user) => ({
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
          phone: user.phone || "",
          role: user.role || "user",
          isBlocked: user.isblocked ? "Yes" : "No",
          createdAt: user.createdAt,
        }));

        headers = [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          { key: "isBlocked", label: "Is Blocked" },
          { key: "createdAt", label: "Created At" },
        ];

        filename = generateCSVFilename("users-export");
        break;

      case "sales":
        if (!startDate || !endDate) {
          return NextResponse.json(
            {
              success: false,
              message: "Start date and end date are required for sales export",
            },
            { status: 400 }
          );
        }

        const salesQuery = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          ...filters,
        };

        const sales = await Order.aggregate([
          { $match: salesQuery },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              productName: { $first: "$items.productName" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.total" },
              orders: { $addToSet: "$_id" },
            },
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              quantity: 1,
              revenue: 1,
              orders: { $size: "$orders" },
            },
          },
          { $sort: { revenue: -1 } },
        ]);

        data = sales.map((sale) => ({
          productId: sale._id,
          productName: sale.productName,
          quantity: sale.quantity,
          revenue: Math.round(sale.revenue * 100) / 100,
          orders: sale.orders,
        }));

        headers = [
          { key: "productId", label: "Product ID" },
          { key: "productName", label: "Product Name" },
          { key: "quantity", label: "Quantity Sold" },
          { key: "revenue", label: "Revenue" },
          { key: "orders", label: "Number of Orders" },
        ];

        filename = generateCSVFilename("sales-export");
        break;
    }

    // If JSON format requested
    if (format === "json") {
      return NextResponse.json(
        {
          success: true,
          message: "Data exported successfully",
          data: data,
        },
        { status: 200 }
      );
    }

    // Generate CSV
    const csv = generateCSV(data, headers);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to export data. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateAdminOrApiKey } from "@/lib/apiKeyAuth";
import { generateCSV, generateCSVFilename } from "@/lib/csvGenerator";

/**
 * GET /api/admin/reports/sales
 * Generate sales report
 * 
 * Query Parameters:
 * - startDate: Start date (ISO format, required)
 * - endDate: End date (ISO format, required)
 * - format: Response format - "json" (default), "csv"
 * - groupBy: Group by - "day", "week", "month", "product", "category", "brand" (default: "day")
 * - status: Filter by order status (optional)
 * - paymentStatus: Filter by payment status (optional)
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error } = await authenticateAdminOrApiKey(request, { permission: "read" });
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
    const groupBy = searchParams.get("groupBy") || "day";
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

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

    // Aggregate sales data based on groupBy
    let salesData = [];
    let groupFormat = "%Y-%m-%d";

    switch (groupBy) {
      case "day":
        groupFormat = "%Y-%m-%d";
        salesData = await Order.aggregate([
          { $match: orderQuery },
          {
            $group: {
              _id: {
                $dateToString: { format: groupFormat, date: "$createdAt" },
              },
              revenue: { $sum: "$total" },
              discount: { $sum: "$discount" },
              orders: { $sum: 1 },
              items: { $sum: { $size: "$items" } },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;

      case "week":
        salesData = await Order.aggregate([
          { $match: orderQuery },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-W%V", date: "$createdAt" },
              },
              revenue: { $sum: "$total" },
              discount: { $sum: "$discount" },
              orders: { $sum: 1 },
              items: { $sum: { $size: "$items" } },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;

      case "month":
        groupFormat = "%Y-%m";
        salesData = await Order.aggregate([
          { $match: orderQuery },
          {
            $group: {
              _id: {
                $dateToString: { format: groupFormat, date: "$createdAt" },
              },
              revenue: { $sum: "$total" },
              discount: { $sum: "$discount" },
              orders: { $sum: 1 },
              items: { $sum: { $size: "$items" } },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;

      case "product":
        salesData = await Order.aggregate([
          { $match: orderQuery },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              productName: { $first: "$items.productName" },
              revenue: { $sum: "$items.total" },
              quantity: { $sum: "$items.quantity" },
              orders: { $addToSet: "$_id" },
              averagePrice: { $avg: "$items.price" },
            },
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              revenue: 1,
              quantity: 1,
              orders: { $size: "$orders" },
              averagePrice: 1,
            },
          },
          { $sort: { revenue: -1 } },
        ]);
        break;

      case "category":
        salesData = await Order.aggregate([
          { $match: orderQuery },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.product",
              foreignField: "_id",
              as: "productData",
            },
          },
          { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "categories",
              localField: "productData.category",
              foreignField: "_id",
              as: "categoryData",
            },
          },
          { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$categoryData._id",
              categoryName: { $first: "$categoryData.name" },
              revenue: { $sum: "$items.total" },
              quantity: { $sum: "$items.quantity" },
              orders: { $addToSet: "$_id" },
            },
          },
          {
            $project: {
              _id: 1,
              categoryName: 1,
              revenue: 1,
              quantity: 1,
              orders: { $size: "$orders" },
            },
          },
          { $sort: { revenue: -1 } },
        ]);
        break;

      case "brand":
        salesData = await Order.aggregate([
          { $match: orderQuery },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.product",
              foreignField: "_id",
              as: "productData",
            },
          },
          { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "brands",
              localField: "productData.brand",
              foreignField: "_id",
              as: "brandData",
            },
          },
          { $unwind: { path: "$brandData", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$brandData._id",
              brandName: { $first: "$brandData.name" },
              revenue: { $sum: "$items.total" },
              quantity: { $sum: "$items.quantity" },
              orders: { $addToSet: "$_id" },
            },
          },
          {
            $project: {
              _id: 1,
              brandName: 1,
              revenue: 1,
              quantity: 1,
              orders: { $size: "$orders" },
            },
          },
          { $sort: { revenue: -1 } },
        ]);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: `Invalid groupBy parameter. Must be one of: day, week, month, product, category, brand`,
          },
          { status: 400 }
        );
    }

    // Format sales data
    const formattedData = salesData.map((item) => {
      const base = {
        period: item._id || "N/A",
        revenue: Math.round(item.revenue * 100) / 100,
        discount: Math.round(item.discount * 100) / 100,
        netRevenue: Math.round((item.revenue - (item.discount || 0)) * 100) / 100,
        orders: item.orders || 0,
        items: item.items || item.quantity || 0,
      };

      if (groupBy === "product") {
        base.productName = item.productName || "N/A";
        base.averagePrice = Math.round(item.averagePrice * 100) / 100;
      } else if (groupBy === "category") {
        base.categoryName = item.categoryName || "N/A";
      } else if (groupBy === "brand") {
        base.brandName = item.brandName || "N/A";
      }

      return base;
    });

    // Calculate totals
    const totals = formattedData.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.discount += item.discount;
        acc.netRevenue += item.netRevenue;
        acc.orders += item.orders;
        acc.items += item.items;
        return acc;
      },
      { revenue: 0, discount: 0, netRevenue: 0, orders: 0, items: 0 }
    );

    // If CSV format requested
    if (format === "csv") {
      const headers = [
        { key: "period", label: groupBy === "day" ? "Date" : groupBy === "week" ? "Week" : groupBy === "month" ? "Month" : groupBy === "product" ? "Product Name" : groupBy === "category" ? "Category Name" : "Brand Name" },
        ...(groupBy === "product" ? [{ key: "averagePrice", label: "Average Price" }] : []),
        { key: "revenue", label: "Revenue" },
        { key: "discount", label: "Discount" },
        { key: "netRevenue", label: "Net Revenue" },
        { key: "orders", label: "Orders" },
        { key: "items", label: "Items Sold" },
      ];

      const csv = generateCSV(formattedData, headers);
      const filename = generateCSVFilename("sales-report");

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
        message: "Sales report generated successfully",
        data: {
          period: {
            startDate: queryStartDate,
            endDate: queryEndDate,
          },
          groupBy: groupBy,
          summary: {
            totalRevenue: Math.round(totals.revenue * 100) / 100,
            totalDiscount: Math.round(totals.discount * 100) / 100,
            netRevenue: Math.round(totals.netRevenue * 100) / 100,
            totalOrders: totals.orders,
            totalItems: totals.items,
            averageOrderValue: totals.orders > 0 ? Math.round((totals.revenue / totals.orders) * 100) / 100 : 0,
          },
          data: formattedData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generate sales report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate sales report. Please try again.",
      },
      { status: 500 }
    );
  }
}


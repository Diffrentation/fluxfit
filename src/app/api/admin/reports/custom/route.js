import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { authenticateAdmin } from "@/lib/auth";
import { generateCSV, generateCSVFilename } from "@/lib/csvGenerator";

/**
 * GET /api/admin/reports/custom
 * Generate custom report
 * 
 * Query Parameters:
 * - reportType: Type of custom report - "sales-by-category", "sales-by-brand", "customer-orders", "product-performance", "revenue-trends" (required)
 * - startDate: Start date (ISO format, required for most reports)
 * - endDate: End date (ISO format, required for most reports)
 * - format: Response format - "json" (default), "csv"
 * - groupBy: Group by period - "day", "week", "month" (optional, for revenue-trends)
 * - limit: Limit number of results (optional, default: 100)
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
    const reportType = searchParams.get("reportType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";
    const groupBy = searchParams.get("groupBy") || "day";
    const limit = parseInt(searchParams.get("limit")) || 100;

    // Validate report type
    const validReportTypes = [
      "sales-by-category",
      "sales-by-brand",
      "customer-orders",
      "product-performance",
      "revenue-trends",
    ];

    if (!reportType || !validReportTypes.includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid reportType. Must be one of: ${validReportTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate dates for reports that require them
    if (
      reportType !== "product-performance" &&
      (!startDate || !endDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date and end date are required for this report type",
        },
        { status: 400 }
      );
    }

    let data = [];
    let headers = [];
    let summary = {};

    switch (reportType) {
      case "sales-by-category":
        const categorySales = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
          },
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
          { $limit: limit },
        ]);

        data = categorySales.map((item) => ({
          categoryId: item._id,
          categoryName: item.categoryName || "Uncategorized",
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
          orders: item.orders,
        }));

        headers = [
          { key: "categoryName", label: "Category Name" },
          { key: "revenue", label: "Revenue" },
          { key: "quantity", label: "Quantity Sold" },
          { key: "orders", label: "Number of Orders" },
        ];

        summary = {
          totalCategories: categorySales.length,
          totalRevenue: Math.round(
            categorySales.reduce((sum, item) => sum + item.revenue, 0) * 100
          ) / 100,
        };
        break;

      case "sales-by-brand":
        const brandSales = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
          },
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
          { $limit: limit },
        ]);

        data = brandSales.map((item) => ({
          brandId: item._id,
          brandName: item.brandName || "Unbranded",
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
          orders: item.orders,
        }));

        headers = [
          { key: "brandName", label: "Brand Name" },
          { key: "revenue", label: "Revenue" },
          { key: "quantity", label: "Quantity Sold" },
          { key: "orders", label: "Number of Orders" },
        ];

        summary = {
          totalBrands: brandSales.length,
          totalRevenue: Math.round(
            brandSales.reduce((sum, item) => sum + item.revenue, 0) * 100
          ) / 100,
        };
        break;

      case "customer-orders":
        const customerOrders = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
          },
          {
            $group: {
              _id: "$user",
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$total" },
              averageOrderValue: { $avg: "$total" },
              lastOrderDate: { $max: "$createdAt" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
          { $sort: { totalSpent: -1 } },
          { $limit: limit },
        ]);

        data = customerOrders.map((item) => ({
          customerId: item._id,
          customerName: item.userData
            ? `${item.userData.firstname} ${item.userData.lastname}`
            : "Guest",
          customerEmail: item.userData?.email || "N/A",
          orderCount: item.orderCount,
          totalSpent: Math.round(item.totalSpent * 100) / 100,
          averageOrderValue: Math.round(item.averageOrderValue * 100) / 100,
          lastOrderDate: item.lastOrderDate,
        }));

        headers = [
          { key: "customerName", label: "Customer Name" },
          { key: "customerEmail", label: "Customer Email" },
          { key: "orderCount", label: "Number of Orders" },
          { key: "totalSpent", label: "Total Spent" },
          { key: "averageOrderValue", label: "Average Order Value" },
          { key: "lastOrderDate", label: "Last Order Date" },
        ];

        summary = {
          totalCustomers: customerOrders.length,
          totalRevenue: Math.round(
            customerOrders.reduce((sum, item) => sum + item.totalSpent, 0) * 100
          ) / 100,
        };
        break;

      case "product-performance":
        const productPerformance = await Order.aggregate([
          {
            $match: startDate && endDate
              ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
              : {},
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              productName: { $first: "$items.productName" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.total" },
              orders: { $addToSet: "$_id" },
              averagePrice: { $avg: "$items.price" },
            },
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              quantity: 1,
              revenue: 1,
              orders: { $size: "$orders" },
              averagePrice: 1,
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: limit },
        ]);

        data = productPerformance.map((item) => ({
          productId: item._id,
          productName: item.productName,
          quantity: item.quantity,
          revenue: Math.round(item.revenue * 100) / 100,
          orders: item.orders,
          averagePrice: Math.round(item.averagePrice * 100) / 100,
        }));

        headers = [
          { key: "productName", label: "Product Name" },
          { key: "quantity", label: "Quantity Sold" },
          { key: "revenue", label: "Revenue" },
          { key: "orders", label: "Number of Orders" },
          { key: "averagePrice", label: "Average Price" },
        ];

        summary = {
          totalProducts: productPerformance.length,
          totalRevenue: Math.round(
            productPerformance.reduce((sum, item) => sum + item.revenue, 0) * 100
          ) / 100,
        };
        break;

      case "revenue-trends":
        let groupFormat = "%Y-%m-%d";
        if (groupBy === "week") {
          groupFormat = "%Y-W%V";
        } else if (groupBy === "month") {
          groupFormat = "%Y-%m";
        }

        const revenueTrends = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
          },
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

        data = revenueTrends.map((item) => ({
          period: item._id,
          revenue: Math.round(item.revenue * 100) / 100,
          discount: Math.round(item.discount * 100) / 100,
          netRevenue: Math.round((item.revenue - item.discount) * 100) / 100,
          orders: item.orders,
          items: item.items,
        }));

        headers = [
          { key: "period", label: groupBy === "day" ? "Date" : groupBy === "week" ? "Week" : "Month" },
          { key: "revenue", label: "Revenue" },
          { key: "discount", label: "Discount" },
          { key: "netRevenue", label: "Net Revenue" },
          { key: "orders", label: "Orders" },
          { key: "items", label: "Items Sold" },
        ];

        summary = {
          totalPeriods: revenueTrends.length,
          totalRevenue: Math.round(
            revenueTrends.reduce((sum, item) => sum + item.revenue, 0) * 100
          ) / 100,
        };
        break;
    }

    // If CSV format requested
    if (format === "csv") {
      const csv = generateCSV(data, headers);
      const filename = generateCSVFilename(`custom-report-${reportType}`);

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
        message: "Custom report generated successfully",
        data: {
          reportType: reportType,
          period: startDate && endDate
            ? {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
              }
            : null,
          summary: summary,
          data: data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generate custom report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate custom report. Please try again.",
      },
      { status: 500 }
    );
  }
}


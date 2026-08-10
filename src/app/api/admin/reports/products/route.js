import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import Order from "@/models/order.model";
import { authenticateAdminOrApiKey } from "@/lib/apiKeyAuth";
import { generateCSV, generateCSVFilename } from "@/lib/csvGenerator";

/**
 * GET /api/admin/reports/products
 * Generate products report
 * 
 * Query Parameters:
 * - format: Response format - "json" (default), "csv"
 * - status: Filter by product status - "active", "inactive", "pending" (optional)
 * - inStock: Filter by stock status - "true", "false" (optional)
 * - category: Filter by category ID (optional)
 * - brand: Filter by brand ID (optional)
 * - includeSales: Include sales data (true/false, default: false)
 * - startDate: Start date for sales data (ISO format, required if includeSales=true)
 * - endDate: End date for sales data (ISO format, required if includeSales=true)
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
    const format = searchParams.get("format") || "json";
    const status = searchParams.get("status");
    const inStock = searchParams.get("inStock");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const includeSales = searchParams.get("includeSales") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build product query
    const productQuery = { isDeleted: false };

    if (status) {
      productQuery.status = status;
    }

    if (inStock === "true") {
      productQuery.inStock = true;
    } else if (inStock === "false") {
      productQuery.inStock = false;
    }

    if (category) {
      productQuery.category = category;
    }

    if (brand) {
      productQuery.brand = brand;
    }

    // Validate sales date parameters
    if (includeSales && (!startDate || !endDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date and end date are required when includeSales=true",
          errors: [
            { field: "startDate", message: "Start date is required" },
            { field: "endDate", message: "End date is required" },
          ],
        },
        { status: 400 }
      );
    }

    // Get products
    const products = await Product.find(productQuery)
      .populate("category", "name slug")
      .populate("brand", "name logo")
      .sort({ createdAt: -1 })
      .lean();

    // Get sales data if requested
    let salesData = {};
    if (includeSales && startDate && endDate) {
      const queryStartDate = new Date(startDate);
      const queryEndDate = new Date(endDate);

      const sales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: queryStartDate, $lte: queryEndDate },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.total" },
            orders: { $addToSet: "$_id" },
          },
        },
        {
          $project: {
            _id: 1,
            quantity: 1,
            revenue: 1,
            orders: { $size: "$orders" },
          },
        },
      ]);

      sales.forEach((sale) => {
        salesData[sale._id.toString()] = {
          quantity: sale.quantity,
          revenue: sale.revenue,
          orders: sale.orders,
        };
      });
    }

    // Format products
    const formattedProducts = products.map((product) => {
      const primaryImage =
        product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      const productData = {
        id: product._id,
        name: product.name,
        slug: product.slug,
        sku: product.sku || null,
        basePrice: Math.round(product.basePrice * 100) / 100,
        originalPrice: product.originalPrice
          ? Math.round(product.originalPrice * 100) / 100
          : null,
        stock: product.stock || 0,
        inStock: product.inStock || false,
        status: product.status,
        category: product.category
          ? {
              id: product.category._id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : null,
        brand: product.brand
          ? {
              id: product.brand._id,
              name: product.brand.name,
            }
          : null,
        image: primaryImage,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      // Add sales data if requested
      if (includeSales) {
        const sales = salesData[product._id.toString()] || {
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
        productData.sales = {
          quantity: sales.quantity,
          revenue: Math.round(sales.revenue * 100) / 100,
          orders: sales.orders,
        };
      }

      return productData;
    });

    // Calculate summary
    const summary = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      inStockProducts: products.filter((p) => p.inStock).length,
      outOfStockProducts: products.filter((p) => !p.inStock).length,
      totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      totalValue: products.reduce(
        (sum, p) => sum + (p.basePrice || 0) * (p.stock || 0),
        0
      ),
    };

    if (includeSales) {
      summary.totalSalesQuantity = formattedProducts.reduce(
        (sum, p) => sum + (p.sales?.quantity || 0),
        0
      );
      summary.totalSalesRevenue = Math.round(
        formattedProducts.reduce((sum, p) => sum + (p.sales?.revenue || 0), 0) * 100
      ) / 100;
    }

    // If CSV format requested
    if (format === "csv") {
      const headers = [
        { key: "name", label: "Product Name" },
        { key: "sku", label: "SKU" },
        { key: "basePrice", label: "Base Price" },
        { key: "originalPrice", label: "Original Price" },
        { key: "stock", label: "Stock" },
        { key: "inStock", label: "In Stock" },
        { key: "status", label: "Status" },
        { key: "category.name", label: "Category" },
        { key: "brand.name", label: "Brand" },
      ];

      if (includeSales) {
        headers.push(
          { key: "sales.quantity", label: "Quantity Sold" },
          { key: "sales.revenue", label: "Sales Revenue" },
          { key: "sales.orders", label: "Number of Orders" }
        );
      }

      // Flatten nested objects for CSV
      const csvData = formattedProducts.map((product) => ({
        name: product.name,
        sku: product.sku || "",
        basePrice: product.basePrice,
        originalPrice: product.originalPrice || "",
        stock: product.stock,
        inStock: product.inStock ? "Yes" : "No",
        status: product.status,
        "category.name": product.category?.name || "",
        "brand.name": product.brand?.name || "",
        ...(includeSales
          ? {
              "sales.quantity": product.sales?.quantity || 0,
              "sales.revenue": product.sales?.revenue || 0,
              "sales.orders": product.sales?.orders || 0,
            }
          : {}),
      }));

      const csv = generateCSV(csvData, headers);
      const filename = generateCSVFilename("products-report");

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
        message: "Products report generated successfully",
        data: {
          summary: summary,
          products: formattedProducts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generate products report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate products report. Please try again.",
      },
      { status: 500 }
    );
  }
}


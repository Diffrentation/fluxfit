import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/top-products
 * Get top-selling products
 * 
 * Query Parameters:
 * - period: Time period - "today", "week", "month", "year", "all" (default: "month")
 * - limit: Number of products to return (default: 10, max: 50)
 * - sort: Sort by - "revenue" (default), "quantity", "orders"
 * - startDate: Start date filter (ISO format, optional)
 * - endDate: End date filter (ISO format, optional)
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
    const period = searchParams.get("period") || "month";
    const limit = Math.min(parseInt(searchParams.get("limit")) || 10, 50);
    const sort = searchParams.get("sort") || "revenue";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const now = new Date();
    let queryStartDate, queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      switch (period) {
        case "today":
          queryStartDate = new Date(now.setHours(0, 0, 0, 0));
          queryEndDate = new Date();
          break;
        case "week":
          queryStartDate = new Date(now);
          queryStartDate.setDate(queryStartDate.getDate() - 7);
          queryEndDate = new Date();
          break;
        case "month":
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          queryEndDate = new Date();
          break;
        case "year":
          queryStartDate = new Date(now.getFullYear(), 0, 1);
          queryEndDate = new Date();
          break;
        case "all":
        default:
          queryStartDate = null;
          queryEndDate = null;
          break;
      }
    }

    // Build query
    const orderQuery = {};
    if (queryStartDate && queryEndDate) {
      orderQuery.createdAt = { $gte: queryStartDate, $lte: queryEndDate };
    }

    // Aggregate top products
    const topProducts = await Order.aggregate([
      { $match: orderQuery },
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
      {
        $sort:
          sort === "quantity"
            ? { quantity: -1 }
            : sort === "orders"
            ? { orders: -1 }
            : { revenue: -1 },
      },
      { $limit: limit },
    ]);

    // Get product details
    const productIds = topProducts.map((item) => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name slug images basePrice originalPrice inStock stock category brand")
      .populate("category", "name slug")
      .populate("brand", "name logo")
      .lean();

    // Create product map
    const productMap = {};
    products.forEach((product) => {
      productMap[product._id.toString()] = product;
    });

    // Format top products
    const formattedProducts = topProducts.map((item, index) => {
      const product = productMap[item._id.toString()];
      const primaryImage =
        product?.images?.find((img) => img.isPrimary)?.url ||
        product?.images?.[0]?.url ||
        null;

      return {
        rank: index + 1,
        product: {
          id: product?._id || item._id,
          name: product?.name || item.productName,
          slug: product?.slug || null,
          image: primaryImage,
          basePrice: product?.basePrice || null,
          originalPrice: product?.originalPrice || null,
          inStock: product?.inStock || false,
          stock: product?.stock || 0,
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
        sales: {
          quantity: item.quantity,
          revenue: Math.round(item.revenue * 100) / 100,
          orders: item.orders,
          averagePrice: Math.round(item.averagePrice * 100) / 100,
        },
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Top products retrieved successfully",
        data: {
          period: {
            type: period,
            startDate: queryStartDate || null,
            endDate: queryEndDate || null,
          },
          sortBy: sort,
          products: formattedProducts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get top products error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve top products. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FlashSale from "@/models/flashsale.model";

/**
 * GET /api/flash-sales
 * Get active flash sales (Public)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort: Sort order - "newest" (default), "oldest", "ending-soon"
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const sort = searchParams.get("sort") || "newest";

    // Build query - only active flash sales that are currently running
    const now = new Date();
    const query = {
      isActive: true,
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.startDate = 1;
        break;
      case "ending-soon":
        sortObj.endDate = 1;
        break;
      case "newest":
      default:
        sortObj.startDate = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [flashSales, total] = await Promise.all([
      FlashSale.find(query)
        .populate("products.product", "name slug images basePrice originalPrice inStock stock category brand")
        .populate("products.product.category", "name slug")
        .populate("products.product.brand", "name logo")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      FlashSale.countDocuments(query),
    ]);

    // Format flash sales for response
    const formattedFlashSales = flashSales.map((sale) => {
      // Calculate time remaining in seconds
      const timeRemaining = Math.max(0, Math.floor((new Date(sale.endDate) - now) / 1000));

      // Format products
      const formattedProducts = sale.products.map((item) => {
        const product = item.product;
        const primaryImage =
          product?.images?.find((img) => img.isPrimary)?.url ||
          product?.images?.[0]?.url ||
          null;

        return {
          id: product?._id || null,
          name: product?.name || null,
          slug: product?.slug || null,
          image: primaryImage,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          discount: item.discount,
          stock: item.stock,
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
        };
      });

      return {
        id: sale._id,
        name: sale.name,
        description: sale.description || null,
        banner: sale.banner || null,
        products: formattedProducts,
        productCount: sale.products.length,
        startDate: sale.startDate,
        endDate: sale.endDate,
        timeRemaining: timeRemaining,
        views: sale.views || 0,
        sales: sale.sales || 0,
        revenue: sale.revenue || 0,
        createdAt: sale.createdAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Active flash sales retrieved successfully",
        data: {
          flashSales: formattedFlashSales,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get flash sales error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve flash sales. Please try again.",
      },
      { status: 500 }
    );
  }
}


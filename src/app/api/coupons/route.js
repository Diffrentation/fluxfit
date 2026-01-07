import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/coupon.model";

/**
 * GET /api/coupons
 * Get active coupons (Public)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - featured: Filter featured coupons (optional)
 * - sort: Sort order - "newest" (default), "oldest", "discount-desc", "discount-asc"
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "newest";

    // Build query - only active, non-deleted, and currently valid coupons
    const now = new Date();
    const query = {
      isActive: true,
      isDeleted: false,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    };

    // Featured filter (if coupon model has featured field, otherwise ignore)
    // Note: The coupon model doesn't have a featured field, so we'll skip this filter
    // If needed, it can be added to the model later

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "discount-asc":
        sortObj.discount = 1;
        break;
      case "discount-desc":
        sortObj.discount = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("categories", "name slug")
        .populate("products", "name slug")
        .populate("brands", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    // Format coupons for response
    const formattedCoupons = coupons.map((coupon) => {
      // Calculate remaining usage
      const remainingUsage = coupon.usageLimit
        ? Math.max(0, coupon.usageLimit - coupon.usageCount)
        : null;

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (new Date(coupon.validUntil) - now) / (1000 * 60 * 60 * 24)
      );

      return {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || null,
        type: coupon.type,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount || null,
        minPurchase: coupon.minPurchase || 0,
        maxPurchase: coupon.maxPurchase || null,
        usageLimit: coupon.usageLimit || null,
        usageCount: coupon.usageCount || 0,
        remainingUsage: remainingUsage,
        perUserLimit: coupon.perUserLimit || 1,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        daysRemaining: daysRemaining,
        applicableTo: coupon.applicableTo,
        categories: coupon.categories || [],
        products: coupon.products || [],
        brands: coupon.brands || [],
        isValid: coupon.isValid || false,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Active coupons retrieved successfully",
        data: {
          coupons: formattedCoupons,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            featured: featured || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve coupons. Please try again.",
      },
      { status: 500 }
    );
  }
}


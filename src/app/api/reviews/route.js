import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Review from "@/models/review.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/reviews
 * Get reviews with filters and pagination.
 *
 * Query params:
 * - productId
 * - rating
 * - search
 * - page (default 1)
 * - limit (default 10)
 * - status (admin only)
 * - scope=admin (requires admin auth)
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const rating = searchParams.get("rating");
    const search = searchParams.get("search");
    const scope = searchParams.get("scope");
    const status = searchParams.get("status");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      100
    );

    const query = {};

    // Default public scope: only approved reviews
    if (scope === "admin") {
      const { error } = await authenticateAdmin(request);
      if (error) return error;
      if (status && status !== "all") {
        query.status = status;
      }
    } else {
      query.status = "approved";
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.product = productId;
    }

    if (rating) {
      const ratingNum = parseInt(rating, 10);
      if (!Number.isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { comment: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("user", "firstname lastname profileimage")
        .populate("product", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      title: review.title || null,
      comment: review.comment,
      status: review.status,
      images: review.images || [],
      helpful: {
        count: review.helpful?.count || 0,
      },
      isVerifiedPurchase: !!review.isVerifiedPurchase,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user
        ? {
            id: review.user._id,
            name: `${review.user.firstname || ""} ${review.user.lastname || ""}`.trim(),
            avatar: review.user.profileimage || null,
          }
        : null,
      product: review.product
        ? {
            id: review.product._id,
            name: review.product.name,
            slug: review.product.slug,
          }
        : null,
    }));

    const payload = {
      success: true,
      reviews: formattedReviews,
      data: {
        reviews: formattedReviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}

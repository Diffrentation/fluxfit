import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Review from "@/models/review.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/reviews
 * Get all reviews with moderation (Admin)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status - "pending", "approved", "rejected", "spam" (optional)
 * - rating: Filter by rating (1-5, optional)
 * - product: Filter by product ID (optional)
 * - user: Filter by user ID (optional)
 * - sort: Sort order - "newest" (default), "oldest", "rating-desc", "rating-asc"
 * - search: Search in review comment/title (optional)
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user: adminUser } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");
    const rating = searchParams.get("rating");
    const productId = searchParams.get("product");
    const userId = searchParams.get("user");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.product = productId;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }

    // Search in comment and title
    if (search && search.trim()) {
      query.$or = [
        { comment: { $regex: search.trim(), $options: "i" } },
        { title: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "rating-desc":
        sortObj.rating = -1;
        sortObj.createdAt = -1;
        break;
      case "rating-asc":
        sortObj.rating = 1;
        sortObj.createdAt = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    const skip = (page - 1) * limit;

    // Get reviews
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("product", "name slug images")
        .populate("user", "firstname lastname email profileimage")
        .populate("moderatedBy", "firstname lastname email")
        .populate("reply.repliedBy", "firstname lastname email")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    // Calculate statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
    };

    stats.forEach((stat) => {
      statusStats[stat._id] = stat.count;
    });

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach((item) => {
      distribution[item._id] = item.count;
    });

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      product: {
        id: review.product._id,
        name: review.product.name,
        slug: review.product.slug,
        image: review.product.images?.[0]?.url || null,
      },
      user: {
        id: review.user._id,
        name: `${review.user.firstname} ${review.user.lastname}`,
        email: review.user.email,
        profileImage: review.user.profileimage || null,
      },
      rating: review.rating,
      title: review.title || null,
      comment: review.comment,
      images: review.images || [],
      helpful: {
        count: review.helpful?.count || 0,
      },
      isVerifiedPurchase: review.isVerifiedPurchase || false,
      status: review.status,
      moderatedBy: review.moderatedBy
        ? {
            id: review.moderatedBy._id,
            name: `${review.moderatedBy.firstname} ${review.moderatedBy.lastname}`,
            email: review.moderatedBy.email,
          }
        : null,
      moderatedAt: review.moderatedAt || null,
      reply: review.reply?.text
        ? {
            text: review.reply.text,
            repliedBy: review.reply.repliedBy
              ? {
                  id: review.reply.repliedBy._id,
                  name: `${review.reply.repliedBy.firstname} ${review.reply.repliedBy.lastname}`,
                  email: review.reply.repliedBy.email,
                }
              : null,
            repliedAt: review.reply.repliedAt,
          }
        : null,
      order: review.order || null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Reviews retrieved successfully",
        data: {
          reviews: formattedReviews,
          statistics: {
            total: total,
            byStatus: statusStats,
            byRating: distribution,
          },
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
            rating: rating || null,
            product: productId || null,
            user: userId || null,
            sort: sort,
            search: search || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin reviews error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve reviews. Please try again.",
      },
      { status: 500 }
    );
  }
}


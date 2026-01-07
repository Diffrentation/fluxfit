import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Review from "@/models/review.model";
import Product from "@/models/product.model";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/products/:id/reviews
 * Get product reviews
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - rating: Filter by rating (1-5, optional)
 * - sort: Sort order - "newest" (default), "oldest", "rating-desc", "rating-asc", "helpful"
 * - status: Filter by status - "approved" (default for public), "pending", "rejected", "spam" (admin only)
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get product ID or slug from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID or slug is required",
        },
        { status: 400 }
      );
    }

    // Find product by ID or slug
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({ _id: id, isdeleted: false });
    } else {
      product = await Product.findOne({ slug: id, isdeleted: false });
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 50);
    const rating = searchParams.get("rating");
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status");

    // Build query
    const query = { product: product._id };

    // For public access, only show approved reviews
    // Check if user is authenticated and admin
    const authHeader = request.headers.get("authorization");
    let isAdmin = false;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const { user } = await authenticateUser(request);
        if (user && user.role === "admin") {
          isAdmin = true;
        }
      } catch (error) {
        // Not authenticated or not admin - use default
      }
    }

    if (!isAdmin) {
      query.status = "approved";
    } else if (status) {
      query.status = status;
    } else {
      query.status = "approved"; // Default to approved even for admin
    }

    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
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
      case "helpful":
        sortObj["helpful.count"] = -1;
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
        .populate("user", "firstname lastname profileimage")
        .populate("reply.repliedBy", "firstname lastname")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: product._id, status: "approved" } },
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
      user: {
        id: review.user._id,
        name: `${review.user.firstname} ${review.user.lastname}`,
        profileImage: review.user.profileimage || null,
      },
      rating: review.rating,
      title: review.title || null,
      comment: review.comment,
      images: review.images || [],
      helpful: {
        count: review.helpful?.count || 0,
        isHelpful: false, // Will be set if user is authenticated
      },
      isVerifiedPurchase: review.isVerifiedPurchase || false,
      reply: review.reply?.text
        ? {
            text: review.reply.text,
            repliedBy: review.reply.repliedBy
              ? {
                  id: review.reply.repliedBy._id,
                  name: `${review.reply.repliedBy.firstname} ${review.reply.repliedBy.lastname}`,
                }
              : null,
            repliedAt: review.reply.repliedAt,
          }
        : null,
      status: isAdmin ? review.status : undefined, // Only show status to admin
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    // Check if user has marked reviews as helpful (if authenticated)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const { user } = await authenticateUser(request);
        if (user) {
          const userHelpfulReviews = await Review.find({
            _id: { $in: formattedReviews.map((r) => r.id) },
            "helpful.users": user._id,
          }).select("_id").lean();

          const helpfulIds = new Set(userHelpfulReviews.map((r) => r._id.toString()));
          formattedReviews.forEach((review) => {
            review.helpful.isHelpful = helpfulIds.has(review.id.toString());
          });
        }
      } catch (error) {
        // Not authenticated - skip
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Product reviews retrieved successfully",
        data: {
          product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
            rating: product.rating || { average: 0, count: 0 },
            reviews: product.reviews || 0,
          },
          reviews: formattedReviews,
          ratingDistribution: distribution,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            rating: rating || null,
            sort: sort,
            status: isAdmin ? (status || "approved") : "approved",
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product reviews error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve product reviews. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/:id/reviews
 * Add product review
 * 
 * Request Body:
 * - rating: Rating (1-5, required)
 * - title: Review title (optional)
 * - comment: Review comment (required)
 * - images: Array of image URLs (optional)
 * - orderId: Order ID for verified purchase (optional)
 */
export async function POST(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get product ID or slug from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID or slug is required",
        },
        { status: 400 }
      );
    }

    // Find product by ID or slug
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({ _id: id, isdeleted: false });
    } else {
      product = await Product.findOne({ slug: id, isdeleted: false });
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { rating, title, comment, images, orderId } = body;

    // Validate required fields
    const errors = [];

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      errors.push({
        field: "rating",
        message: "Rating is required and must be a number between 1 and 5",
      });
    }

    if (!comment || !comment.trim()) {
      errors.push({
        field: "comment",
        message: "Review comment is required",
      });
    }

    if (title && title.length > 200) {
      errors.push({
        field: "title",
        message: "Review title must be 200 characters or less",
      });
    }

    if (images && !Array.isArray(images)) {
      errors.push({
        field: "images",
        message: "Images must be an array",
      });
    }

    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (typeof img === "string") {
          // If it's just a URL string, convert to object
          images[i] = { url: img, alt: "" };
        } else if (typeof img === "object" && !img.url) {
          errors.push({
            field: `images[${i}]`,
            message: "Each image must have a URL",
          });
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: product._id,
      user: user._id,
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this product. You can only submit one review per product.",
          errors: [
            {
              field: "product",
              message: "Review already exists for this product",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Verify purchase if orderId is provided
    let isVerifiedPurchase = false;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      const order = await Order.findOne({
        _id: orderId,
        user: user._id,
        status: { $in: ["delivered", "completed"] },
      });

      if (order) {
        // Check if order contains this product
        // Handle both populated and unpopulated product references
        const hasProduct = order.items?.some((item) => {
          const itemProductId = item.product?._id
            ? item.product._id.toString()
            : item.product?.toString();
          return itemProductId === product._id.toString();
        });
        if (hasProduct) {
          isVerifiedPurchase = true;
        }
      }
    }

    // Create review
    const review = new Review({
      product: product._id,
      user: user._id,
      order: orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null,
      rating: Math.round(rating),
      title: title?.trim() || null,
      comment: comment.trim(),
      images: images || [],
      isVerifiedPurchase: isVerifiedPurchase,
      status: "pending", // Reviews need moderation by default
    });

    await review.save();

    // Populate user data
    await review.populate("user", "firstname lastname profileimage");

    // Format review
    const formattedReview = {
      id: review._id,
      user: {
        id: review.user._id,
        name: `${review.user.firstname} ${review.user.lastname}`,
        profileImage: review.user.profileimage || null,
      },
      rating: review.rating,
      title: review.title || null,
      comment: review.comment,
      images: review.images || [],
      helpful: {
        count: 0,
        isHelpful: false,
      },
      isVerifiedPurchase: review.isVerifiedPurchase,
      reply: null,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully. It will be visible after moderation.",
        data: {
          review: formattedReview,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product review error:", error);
    
    // Handle duplicate key error (unique constraint on user + product)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this product. You can only submit one review per product.",
          errors: [
            {
              field: "product",
              message: "Review already exists for this product",
            },
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit review. Please try again.",
      },
      { status: 500 }
    );
  }
}


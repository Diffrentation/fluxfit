import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Review from "@/models/review.model";
import Product from "@/models/product.model";
import { authenticateUser, authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/reviews/:id
 * Update review
 * 
 * Users can only update their own reviews.
 * Admins can update any review.
 * 
 * Request Body (all optional):
 * - rating: Rating (1-5)
 * - title: Review title
 * - comment: Review comment
 * - images: Array of image objects [{url, alt}]
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get review ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review ID",
        },
        { status: 400 }
      );
    }

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Review not found",
        },
        { status: 404 }
      );
    }

    // Check if user is admin or owns the review
    const isAdmin = user.role === "admin";
    const isOwner = review.user.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only update your own reviews",
        },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { rating, title, comment, images } = body;

    // Track if rating changed (for product rating update)
    const ratingChanged = rating !== undefined && rating !== review.rating;
    const oldStatus = review.status;

    // Validate and update fields
    const errors = [];

    if (rating !== undefined) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        errors.push({
          field: "rating",
          message: "Rating must be a number between 1 and 5",
        });
      } else {
        review.rating = Math.round(rating);
      }
    }

    if (title !== undefined) {
      if (title === null || title === "") {
        review.title = null;
      } else if (typeof title === "string") {
        if (title.length > 200) {
          errors.push({
            field: "title",
            message: "Review title must be 200 characters or less",
          });
        } else {
          review.title = title.trim();
        }
      } else {
        errors.push({
          field: "title",
          message: "Title must be a string",
        });
      }
    }

    if (comment !== undefined) {
      if (!comment || !comment.trim()) {
        errors.push({
          field: "comment",
          message: "Review comment is required",
        });
      } else {
        review.comment = comment.trim();
      }
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        errors.push({
          field: "images",
          message: "Images must be an array",
        });
      } else {
        // Validate and format images
        const formattedImages = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (typeof img === "string") {
            // If it's just a URL string, convert to object
            formattedImages.push({ url: img, alt: "" });
          } else if (typeof img === "object" && img.url) {
            formattedImages.push({
              url: img.url,
              alt: img.alt || "",
            });
          } else {
            errors.push({
              field: `images[${i}]`,
              message: "Each image must have a URL",
            });
          }
        }
        if (errors.filter((e) => e.field.startsWith("images")).length === 0) {
          review.images = formattedImages;
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

    // If user updated their own review, reset status to pending for moderation
    // (unless it was already rejected/spam)
    if (!isAdmin && isOwner && review.status === "approved") {
      review.status = "pending";
    }

    // Save review
    await review.save();

    // Update product rating if rating changed or status changed to approved
    if (ratingChanged || (oldStatus !== "approved" && review.status === "approved")) {
      await Review.updateProductRating(review.product);
    }

    // Populate user and product data
    await review.populate("user", "firstname lastname profileimage");
    await review.populate("product", "name slug");

    // Format review
    const formattedReview = {
      id: review._id,
      product: {
        id: review.product._id,
        name: review.product.name,
        slug: review.product.slug,
      },
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
      },
      isVerifiedPurchase: review.isVerifiedPurchase,
      reply: review.reply?.text
        ? {
            text: review.reply.text,
            repliedAt: review.reply.repliedAt,
          }
        : null,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: isAdmin
          ? "Review updated successfully"
          : "Review updated successfully. It will be visible after moderation.",
        data: {
          review: formattedReview,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update review. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete review
 * 
 * Users can only delete their own reviews.
 * Admins can delete any review.
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get review ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review ID",
        },
        { status: 400 }
      );
    }

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Review not found",
        },
        { status: 404 }
      );
    }

    // Check if user is admin or owns the review
    const isAdmin = user.role === "admin";
    const isOwner = review.user.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only delete your own reviews",
        },
        { status: 403 }
      );
    }

    // Store product ID and status for rating update
    const productId = review.product;
    const wasApproved = review.status === "approved";

    // Store review info before deletion
    const reviewInfo = {
      id: review._id,
      product: productId,
      user: review.user,
      rating: review.rating,
      status: review.status,
    };

    // Delete review
    await Review.findByIdAndDelete(id);

    // Update product rating if review was approved
    if (wasApproved) {
      await Review.updateProductRating(productId);
      
      // If no approved reviews remain, reset product rating
      const approvedCount = await Review.countDocuments({
        product: productId,
        status: "approved",
      });
      
      if (approvedCount === 0) {
        await Product.findByIdAndUpdate(productId, {
          "rating.average": 0,
          "rating.count": 0,
          reviews: 0,
        });
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Review deleted successfully",
        data: {
          deletedReview: reviewInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete review. Please try again.",
      },
      { status: 500 }
    );
  }
}


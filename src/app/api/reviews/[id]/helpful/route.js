import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Review from "@/models/review.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * POST /api/reviews/:id/helpful
 * Mark/unmark review as helpful
 * 
 * This endpoint toggles the helpful status for a review.
 * If the user has already marked it as helpful, it will unmark it.
 * If not, it will mark it as helpful.
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

    // Get review ID
    const { id } = await params;
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

    // Check if review is approved (only approved reviews can be marked helpful)
    if (review.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message: "Only approved reviews can be marked as helpful",
        },
        { status: 400 }
      );
    }

    // Check if user already marked this review as helpful
    const isAlreadyHelpful = review.helpful.users.some(
      (userId) => userId.toString() === user._id.toString()
    );

    if (isAlreadyHelpful) {
      return NextResponse.json(
        {
          success: true,
          message: "You have already marked this review as helpful",
          review: {
            id: review._id,
            helpful: {
              count: review.helpful.count,
              isHelpful: true,
            },
          },
          data: {
            review: {
              id: review._id,
              helpful: {
                count: review.helpful.count,
                isHelpful: true,
              },
            },
            action: "already_marked",
          },
        },
        { status: 200 }
      );
    }

    // Mark as helpful
    await review.markHelpful(user._id);

    // Reload review to get updated helpful count
    await review.populate("user", "firstname lastname profileimage");

    // Format review
    const formattedReview = {
      id: review._id,
      helpful: {
        count: review.helpful.count,
        isHelpful: !isAlreadyHelpful, // New status after toggle
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Review marked as helpful successfully",
        review: formattedReview,
        data: {
          review: formattedReview,
          action: "marked",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mark review helpful error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to mark review as helpful. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Wishlist from "@/models/wishlist.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * DELETE /api/wishlist/items/:itemId
 * Remove item from wishlist
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

    // Get item ID from params
    const { itemId } = params;

    // Validate item ID
    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
          errors: [
            {
              field: "itemId",
              message: "Item ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item ID format",
          errors: [
            {
              field: "itemId",
              message: "Item ID must be a valid ObjectId",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get user's wishlist
    const wishlist = await Wishlist.findOne({ user: user._id });

    if (!wishlist) {
      return NextResponse.json(
        {
          success: false,
          message: "Wishlist not found",
        },
        { status: 404 }
      );
    }

    // Find the item in wishlist
    const item = wishlist.items.id(itemId);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Wishlist item not found",
        },
        { status: 404 }
      );
    }

    // Store product ID for response
    const productId = item.product;

    // Remove item from wishlist
    wishlist.items.pull(itemId);
    wishlist.lastUpdated = new Date();
    await wishlist.save();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Item removed from wishlist successfully",
        data: {
          itemId: itemId,
          productId: productId,
          wishlist: {
            itemCount: wishlist.items.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove wishlist item error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to remove item from wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}


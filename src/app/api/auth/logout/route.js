import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import jwt from "jsonwebtoken";

/**
 * POST /api/auth/logout
 * Logout user by invalidating their token
 */
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "No token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-change-in-production"
      );
    } catch (jwtError) {
      // Token is invalid or expired, but we still consider logout successful
      return NextResponse.json(
        {
          success: true,
          message: "Logged out successfully",
        },
        { status: 200 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user and clear their token
    const user = await User.findById(decoded.userId);

    if (user) {
      user.token = null;
      await user.save({ validateBeforeSave: false });
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);

    // Even on error, we return success for logout
    // as the client should clear their token regardless
    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
  }
}

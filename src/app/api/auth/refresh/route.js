import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { REFRESH_COOKIE_NAME, setRefreshTokenCookie } from "@/lib/authCookies";

/**
 * POST /api/auth/refresh
 * Rotates refresh cookie and returns a new access token.
 */
export async function POST(request) {
  try {
    const refreshCookie =
      request.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      request.cookies.get("refreshToken")?.value;

    if (!refreshCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "No refresh token",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshCookie,
        process.env.JWT_SECRET || "your-secret-key-change-in-production"
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    if (decoded.type !== "refresh" || !decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refresh token",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: refreshCookie,
      isdeleted: false,
    }).select("+refreshToken +token");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    const { accessToken, refreshToken } = user.generateTokenPair();
    await user.save({ validateBeforeSave: false });

    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed",
        data: {
          accessToken,
          token: accessToken,
        },
      },
      { status: 200 }
    );
    setRefreshTokenCookie(response, refreshToken);
    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to refresh session",
      },
      { status: 500 }
    );
  }
}

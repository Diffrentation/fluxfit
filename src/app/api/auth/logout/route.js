import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import jwt from "jsonwebtoken";
import { REFRESH_COOKIE_NAME, clearRefreshTokenCookie } from "@/lib/authCookies";

/**
 * POST /api/auth/logout
 * Logout user by invalidating their token
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const refreshCookie =
      request.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      request.cookies.get("refreshToken")?.value;

    let decoded = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key-change-in-production"
        );
      } catch {
        decoded = null;
      }
    }

    await connectDB();

    let user = null;
    if (decoded?.userId) {
      user = await User.findById(decoded.userId).select("+refreshToken");
    }
    if (!user && refreshCookie) {
      try {
        const r = jwt.verify(
          refreshCookie,
          process.env.JWT_SECRET || "your-secret-key-change-in-production"
        );
        if (r.type === "refresh" && r.userId) {
          user = await User.findOne({
            _id: r.userId,
            refreshToken: refreshCookie,
          }).select("+refreshToken");
        }
      } catch {
        // ignore
      }
    }

    if (user) {
      user.token = null;
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
    clearRefreshTokenCookie(response);
    return response;
  } catch (error) {
    console.error("Logout error:", error);

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
    clearRefreshTokenCookie(response);
    return response;
  }
}

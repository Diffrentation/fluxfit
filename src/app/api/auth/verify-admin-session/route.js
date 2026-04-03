import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

const getSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * GET /api/auth/verify-admin-session
 * Used by middleware when the refresh JWT has no `role` claim (legacy tokens).
 * Confirms the session cookie matches DB and the user is an admin.
 */
export async function GET(request) {
  try {
    const refreshCookie = request.cookies.get("refreshToken")?.value;
    if (!refreshCookie) {
      return NextResponse.json({ admin: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshCookie, getSecret());
    } catch {
      return NextResponse.json({ admin: false });
    }

    if (decoded.type !== "refresh" || !decoded.userId) {
      return NextResponse.json({ admin: false });
    }

    await connectDB();
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: refreshCookie,
      isdeleted: false,
      isblocked: false,
    })
      .select("+refreshToken role")
      .lean();

    if (!user) {
      return NextResponse.json({ admin: false });
    }

    const admin = String(user.role || "").trim() === "admin";
    return NextResponse.json({ admin });
  } catch {
    return NextResponse.json({ admin: false });
  }
}

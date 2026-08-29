import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge } from "@/models";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error, user } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const challenges = await Challenge.find(query)
      .populate("order", "orderNumber total status items")
      .populate("user", "firstname lastname email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Challenge.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        challenges,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error("Admin Fetch Challenges Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch challenges" }, { status: 500 });
  }
}

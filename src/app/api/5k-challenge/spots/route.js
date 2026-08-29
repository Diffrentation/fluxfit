import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Challenge } from "@/models";
import connectDB from "@/lib/db";

export async function GET() {
  try {
    await connectDB();

    // Count how many challenges are active/registered (not rejected or expired)
    const activeChallengesCount = await Challenge.countDocuments({
      status: { $in: ["registered", "active", "video_submitted", "under_review", "qualified", "completed"] },
    });

    const maxSpots = 20;
    const remainingSpots = Math.max(0, maxSpots - activeChallengesCount);

    return NextResponse.json({
      success: true,
      data: {
        totalSpots: maxSpots,
        activeChallenges: activeChallengesCount,
        remainingSpots,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge spots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch challenge spots" },
      { status: 500 }
    );
  }
}

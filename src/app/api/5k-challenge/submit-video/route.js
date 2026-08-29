import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge } from "@/models";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const token = request.cookies.get("ff_5k_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    
    await connectDB();
    const { videoUrl } = await request.json();

    if (!videoUrl || !videoUrl.includes("http")) {
      return NextResponse.json({ success: false, error: "Valid Video URL is required." }, { status: 400 });
    }

    const challenge = await Challenge.findById(decoded.challengeId);
    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    if (challenge.status !== "registered" && challenge.status !== "active") {
      return NextResponse.json({ success: false, error: "Video already submitted or challenge closed." }, { status: 400 });
    }

    // Check if duplicate videoUrl across whole collection
    const existingVideo = await Challenge.findOne({ videoUrl });
    if (existingVideo && existingVideo._id.toString() !== challenge._id.toString()) {
      return NextResponse.json({ success: false, error: "This video URL has already been submitted for another challenge." }, { status: 400 });
    }

    challenge.videoUrl = videoUrl;
    challenge.status = "video_submitted";
    await challenge.save();

    return NextResponse.json({
      success: true,
      message: "Video submitted successfully!",
      data: {
        status: challenge.status,
        videoUrl: challenge.videoUrl
      }
    });
  } catch (error) {
    console.error("Submit video error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "This video URL has already been submitted." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to submit video." }, { status: 500 });
  }
}

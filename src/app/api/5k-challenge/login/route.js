import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge, Order } from "@/models";
import jwt from "jsonwebtoken";
import { authenticateUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    await connectDB();
    const { email, orderNumber } = await request.json();

    if (!email || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Email and Order Number are required." },
        { status: 400 }
      );
    }

    // 1. Find Order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Invalid Order Number." },
        { status: 401 }
      );
    }

    if (!order.user || String(order.user) !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "This order does not belong to your account." },
        { status: 403 }
      );
    }

    // 2. Find Challenge
    const challenge = await Challenge.findOne({ order: order._id, email: email.toLowerCase() });
    
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "No 5K Challenge found for this email and order combination." },
        { status: 401 }
      );
    }

    if (!challenge.user || String(challenge.user) !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "This challenge does not belong to your account." },
        { status: 403 }
      );
    }

    // 3. Create Token
    const token = jwt.sign(
      { challengeId: challenge._id },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    // 4. Set Cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      data: {
        challengeId: challenge.challengeId,
        status: challenge.status,
      }
    });

    response.cookies.set("ff_5k_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("5K Login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  // Check if logged in
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    const token = request.cookies.get("ff_5k_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    await connectDB();
    const challenge = await Challenge.findById(decoded.challengeId).populate("order", "orderNumber");

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 401 });
    }

    if (!challenge.user || String(challenge.user) !== String(user._id)) {
      const response = NextResponse.json(
        { success: false, error: "Challenge session does not match this account." },
        { status: 401 }
      );
      response.cookies.set("ff_5k_token", "", { httpOnly: true, maxAge: 0, path: "/" });
      return response;
    }

    return NextResponse.json({
      success: true,
      data: {
        challengeId: challenge.challengeId,
        orderNumber: challenge.order?.orderNumber,
        status: challenge.status,
        views: challenge.views,
        likes: challenge.likes,
        comments: challenge.comments,
        deadline: challenge.deadline,
        videoUrl: challenge.videoUrl,
        platform: challenge.platform,
        name: challenge.name,
        email: challenge.email,
        socialHandle: challenge.socialHandle,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
  }
}

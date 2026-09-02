import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge, Order } from "@/models";
import { sendChallengeEmail } from "@/lib/email";
import jwt from "jsonwebtoken";
import { authenticateUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await Order.findOne({ orderNumber }).select("user status");
    if (!order || !order.user || String(order.user) !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "Order not found for this account." },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json({
        success: true,
        data: {
          eligible: false,
          status: order.status,
          message: "You can join the 5K Challenge after this order has been delivered.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { eligible: true, status: order.status },
    });
  } catch (error) {
    console.error("5K eligibility check error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to check order eligibility." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const {
      name,
      email,
      orderNumber,
      socialHandle,
      platform = "instagram",
      agreedToTerms,
    } = body;

    if (!name || !email || !orderNumber || !socialHandle || !agreedToTerms) {
      return NextResponse.json(
        { success: false, error: "All fields and agreements are required." },
        { status: 400 }
      );
    }

    // 1. Check spots limit
    const activeChallengesCount = await Challenge.countDocuments({
      status: { $in: ["registered", "active", "video_submitted", "under_review", "qualified", "completed"] },
    });

    if (activeChallengesCount >= 20) {
      return NextResponse.json(
        { success: false, error: "Sorry, all 20 spots have been filled for this batch!" },
        { status: 400 }
      );
    }

    // 2. Look up Order
    const order = await Order.findOne({ orderNumber }).populate("user");
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please check your Order Number." },
        { status: 404 }
      );
    }

    if (!order.user || String(order.user._id) !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "This order does not belong to your account." },
        { status: 403 }
      );
    }

    // 3. Verify Order Delivery and Return Status
    if (order.status !== "delivered") {
      return NextResponse.json(
        { success: false, error: "Challenge is only eligible for orders that have been delivered." },
        { status: 400 }
      );
    }

    if (order.cancellation && order.cancellation.requested) {
      return NextResponse.json(
        { success: false, error: "Orders with cancellation requests are not eligible." },
        { status: 400 }
      );
    }

    const hasReturnedItems = order.items.some(
      (item) => item.returnRequested || item.refundRequested || ["returned", "refunded", "cancelled"].includes(item.status)
    );

    if (hasReturnedItems) {
      return NextResponse.json(
        { success: false, error: "Orders with returned or refunded items are not eligible." },
        { status: 400 }
      );
    }

    // Check email matches order user or billing
    if (order.user && order.user.email !== email && order.billingAddress.email !== email) {
      // Allow it if they used guest or different email, but might be good to warn.
      // For now, we'll proceed.
    }

    // 4. Duplicate Protection
    const existingChallenge = await Challenge.findOne({ order: order._id });
    if (existingChallenge) {
      return NextResponse.json(
        { success: false, error: "A challenge registration already exists for this order." },
        { status: 400 }
      );
    }

    // 5. Calculate deadline (15 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 15);

    // 6. Create Challenge
    const challengeId = Challenge.generateChallengeId();
    const challenge = await Challenge.create({
      challengeId,
      order: order._id,
      user: user._id,
      name,
      email,
      socialHandle,
      platform,
      agreedToTerms,
      deadline,
      status: "registered"
    });

    // Send registration email asynchronously (don't await so we don't slow down response)
    sendChallengeEmail(email, "registration", challenge).catch(err => console.error("Error sending 5k email:", err));

    // Log the user straight into their challenge session so they land on the
    // video-submission view instead of the registration form on next load.
    const token = jwt.sign(
      { challengeId: challenge._id },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Successfully registered for the 5K Challenge!",
        data: {
          challengeId: challenge.challengeId,
          orderNumber: order.orderNumber,
          name: challenge.name,
          email: challenge.email,
          socialHandle: challenge.socialHandle,
          platform: challenge.platform,
          status: challenge.status,
          views: challenge.views,
          likes: challenge.likes,
          comments: challenge.comments,
          videoUrl: challenge.videoUrl,
          deadline: challenge.deadline,
        },
      },
      { status: 201 }
    );

    response.cookies.set("ff_5k_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error registering challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register for the challenge." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge, Order } from "@/models";
import { sendChallengeEmail } from "@/lib/email";

export async function POST(request) {
  try {
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
      user: order.user ? order.user._id : null,
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

    return NextResponse.json(
      {
        success: true,
        message: "Successfully registered for the 5K Challenge!",
        data: {
          challengeId: challenge.challengeId,
          deadline: challenge.deadline,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register for the challenge." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge } from "@/models";
import { authenticateAdmin } from "@/lib/auth";
import { sendChallengeEmail } from "@/lib/email";

export async function PUT(request, { params }) {
  try {
    const { error, user } = await authenticateAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { status, adminNotes, views, likes, comments, deadline } = await request.json();

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    if (status) challenge.status = status;
    if (adminNotes !== undefined) challenge.notes.admin = adminNotes;
    if (views !== undefined) challenge.views = views;
    if (likes !== undefined) challenge.likes = likes;
    if (comments !== undefined) challenge.comments = comments;
    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid deadline date" }, { status: 400 });
      }
      challenge.deadline = parsedDeadline;
    }

    await challenge.save();

    // Trigger emails based on status change (Phase 5)
    if (status === "completed") {
      sendChallengeEmail(challenge.email, "completion", challenge).catch(e => console.error(e));
    } else if (status === "rejected") {
      sendChallengeEmail(challenge.email, "rejection", challenge).catch(e => console.error(e));
    }

    return NextResponse.json({
      success: true,
      message: "Challenge updated successfully",
      data: challenge
    });
  } catch (error) {
    console.error("Admin Update Challenge Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update challenge" }, { status: 500 });
  }
}

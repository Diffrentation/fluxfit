import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Challenge } from "@/models";
import { sendChallengeEmail } from "@/lib/email";

export async function GET(request) {
  try {
    // Basic security check (in a real app, use a secret token from cron service)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    const now = new Date();
    
    // Day 5 Reminder: Registered exactly 5 days ago (between 5 and 6 days)
    const fiveDaysAgoStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const fiveDaysAgoEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const day5Challenges = await Challenge.find({
      status: { $in: ["registered", "active"] },
      createdAt: { $gte: fiveDaysAgoStart, $lte: fiveDaysAgoEnd },
    });

    for (const c of day5Challenges) {
      await sendChallengeEmail(c.email, "reminder-5", c).catch(e => console.error(e));
    }

    // Day 10 Reminder: Registered exactly 10 days ago
    const tenDaysAgoStart = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000);
    const tenDaysAgoEnd = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const day10Challenges = await Challenge.find({
      status: { $in: ["registered", "active"] },
      createdAt: { $gte: tenDaysAgoStart, $lte: tenDaysAgoEnd },
    });

    for (const c of day10Challenges) {
      await sendChallengeEmail(c.email, "reminder-10", c).catch(e => console.error(e));
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${day5Challenges.length} Day-5 reminders and ${day10Challenges.length} Day-10 reminders.`
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

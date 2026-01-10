import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { sendOTPEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 */
export async function POST(request) {
  try {

    // Connect to database
    try {
      await connectDB();
    } catch (error) {
      console.error("Failed to connect to database:", error);
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, email, type = "email-verification" } = body;

    let user = null;

    // ✅ if userId provided
    if (userId) {
      user = await User.findOne({ _id: userId, isdeleted: false });
    }
    // ✅ else find by email
    else if (email) {
      user = await User.findOne({ email: email.toLowerCase(), isdeleted: false });
    } else {
      return NextResponse.json(
        { success: false, message: "Please provide userId or email address" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (type === "email-verification" && user.isverified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 }
      );
    }

    const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");
    const otp = await user.generateOTP(type, OTP_EXPIRY_MINUTES);

    const emailResult = await sendOTPEmail(user.email, otp, type);
    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP resent successfully ✅",
        data: { userId: user._id, email: user.email, otpSent: true },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Resend OTP failed" },
      { status: 500 }
    );
  }
}

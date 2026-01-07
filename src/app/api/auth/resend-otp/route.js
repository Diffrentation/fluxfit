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
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, type = "email-verification" } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide email address",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address format",
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["email-verification", "password-reset", "login"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid OTP type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isdeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found with this email address",
        },
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (user.isblocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Check if user is already verified (for email-verification type)
    if (type === "email-verification" && user.isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is already verified",
        },
        { status: 400 }
      );
    }

    // Generate new OTP
    const OTP_EXPIRY_MINUTES = 10;
    let otp = null;
    try {
      otp = await user.generateOTP(type, OTP_EXPIRY_MINUTES);

      // Extend verification expiry for email-verification type
      if (type === "email-verification" && !user.isverified) {
        user.verificationExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await user.save({ validateBeforeSave: false });
      }

      // Send OTP email
      const emailResult = await sendOTPEmail(user.email, otp, type);

      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send OTP email. Please try again later.",
          },
          { status: 500 }
        );
      }
    } catch (otpError) {
      console.error("Error generating/sending OTP:", otpError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to generate OTP. Please try again.",
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "OTP has been sent to your email address",
        data: {
          email: user.email,
          otpSent: true,
          expiresIn: "10 minutes",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to resend OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}


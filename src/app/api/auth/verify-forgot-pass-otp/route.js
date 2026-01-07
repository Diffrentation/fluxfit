import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import OTP from "@/models/otp.model";

/**
 * POST /api/auth/verify-forgot-pass-otp
 * Verify OTP sent for password reset
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { userId, otp } = body;

    // Validate required fields
    if (!userId || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide both userId and OTP",
        },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP format. OTP must be 6 digits",
        },
        { status: 400 }
      );
    }

    // Find user by userId
    const user = await User.findOne({
      _id: userId,
      isdeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
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

    // Verify OTP for password-reset type
    const verificationResult = await OTP.verifyOTPByUserId(
      userId,
      otp,
      "password-reset"
    );

    if (!verificationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message || "Invalid or expired OTP",
        },
        { status: 400 }
      );
    }

    // Generate a temporary reset token (can be used for password reset)
    // This allows the frontend to proceed with password reset
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Return success response with reset token
    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully. You can now reset your password.",
        data: {
          userId: user._id,
          email: user.email,
          resetToken,
          verified: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password OTP verification error:", error);

    // Handle invalid ObjectId format
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID format",
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "OTP verification failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

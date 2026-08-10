import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import OTP from "@/models/otp.model";
import { sendWelcomeEmail } from "@/lib/email";
import { setRefreshTokenCookie } from "@/lib/authCookies";

/**
 * POST /api/auth/verify-otp
 * Verify OTP and mark user as verified
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { userId, otp, type = "email-verification" } = body;

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

    // Verify OTP using the OTP model with userId
    const verificationResult = await OTP.verifyOTPByUserId(userId, otp, type);

    if (!verificationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message || "Invalid or expired OTP",
        },
        { status: 400 }
      );
    }

    // Update user verification status (for email-verification)
    if (type === "email-verification") {
      user.isverified = true;
      // Clear verificationExpiresAt so user won't be auto-deleted
      user.verificationExpiresAt = null;
      await user.save({ validateBeforeSave: false });

      // Send welcome email using email utility
      try {
        const emailResult = await sendWelcomeEmail(user.email, {
          firstname: user.firstname,
          lastname: user.lastname,
        });

        if (!emailResult.success) {
          console.error("Failed to send welcome email:", emailResult.error);
        } else {
          console.log("✅ Welcome email sent successfully");
        }
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail verification if welcome email fails
      }
    }

    const basePayload = {
      success: true,
      message:
        type === "email-verification"
          ? "Email verified successfully! Welcome to FluxFit."
          : "OTP verified successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          isverified: user.isverified,
          phone: user.phone || null,
          address: user.address || null,
          profileimage: user.profileimage || null,
        },
        verified: true,
      },
    };

    if (type === "email-verification") {
      const { accessToken, refreshToken } = user.generateTokenPair();
      await user.save({ validateBeforeSave: false });
      const response = NextResponse.json(
        {
          ...basePayload,
          data: {
            ...basePayload.data,
            token: accessToken,
            accessToken,
          },
        },
        { status: 200 }
      );
      setRefreshTokenCookie(response, refreshToken);
      return response;
    }

    if (type === "password-reset") {
      // Issue a single-use, short-lived reset token bound to this specific
      // verification event — reset-password must present it, so knowing the
      // userId alone is no longer enough to change the password.
      const resetToken = user.generatePasswordResetToken();
      await user.save({ validateBeforeSave: false });
      return NextResponse.json(
        {
          ...basePayload,
          data: {
            ...basePayload.data,
            resetToken,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ...basePayload,
        data: {
          ...basePayload.data,
          token: user.token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);

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

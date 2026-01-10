import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { sendOTPEmail } from "@/lib/email";
import { sendOTPSMS } from "@/lib/sms";

/**
 * POST /api/auth/forgot-password
 * Send OTP for password reset via email or phone
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, phone, method } = body;

    // Validate that at least one identifier is provided
    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide either email or phone number",
        },
        { status: 400 }
      );
    }

    // Auto-detect method based on provided identifiers if method not specified
    let detectedMethod = method;
    if (!detectedMethod) {
      if (email && phone) {
        detectedMethod = "both";
      } else if (phone) {
        detectedMethod = "phone";
      } else if (email) {
        detectedMethod = "email";
      }
    }

    // Validate method
    const validMethods = ["email", "phone", "both"];
    if (!validMethods.includes(detectedMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid method. Must be one of: ${validMethods.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Build query to find user
    const query = { isdeleted: false };
    if (email && phone) {
      query.$or = [{ email: email.toLowerCase() }, { phone: phone.trim() }];
    } else if (email) {
      query.email = email.toLowerCase();
    } else if (phone) {
      query.phone = phone.trim();
    }

    // Find user
    const user = await User.findOne(query);

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this information, an OTP has been sent",
        },
        { status: 200 }
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

    // Generate OTP for password reset
    const OTP_EXPIRY_MINUTES = 1;
    let otp = null;
    const results = {
      email: null,
      phone: null,
    };

    try {
      otp = await user.generateOTP("password-reset", OTP_EXPIRY_MINUTES);

      // Send OTP via email if requested
      if (
        (detectedMethod === "email" || detectedMethod === "both") &&
        user.email
      ) {
        const emailResult = await sendOTPEmail(
          user.email,
          otp,
          "password-reset"
        );
        results.email = emailResult.success;

        if (!emailResult.success) {
          console.error("Failed to send OTP email:", emailResult.error);
        }
      }

      // Send OTP via SMS if requested
      if (
        (detectedMethod === "phone" || detectedMethod === "both") &&
        user.phone
      ) {
        console.log(`📱 Attempting to send SMS OTP to: ${user.phone}`);
        const smsResult = await sendOTPSMS(user.phone, otp, "password-reset");
        results.phone = smsResult.success;

        if (!smsResult.success) {
          console.error("❌ Failed to send OTP SMS:");
          console.error(`   Error: ${smsResult.error}`);
          console.error(`   Error Code: ${smsResult.errorCode || "N/A"}`);
          console.error(`   Message: ${smsResult.message}`);
        } else {
          console.log(
            `✅ SMS OTP sent successfully to: ${smsResult.to || user.phone}`
          );
          console.log(`   Message SID: ${smsResult.sid || "N/A"}`);
        }
      } else if (
        (detectedMethod === "phone" || detectedMethod === "both") &&
        !user.phone
      ) {
        console.warn(`⚠️ SMS requested but user has no phone number on record`);
      }

      // Check if at least one method succeeded
      const anySuccess = results.email || results.phone;

      if (!anySuccess) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send OTP. Please try again later.",
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

    // Build success message based on what was sent
    let successMessage = "OTP has been sent";
    if (detectedMethod === "both") {
      const sentTo = [];
      if (results.email) sentTo.push("email");
      if (results.phone) sentTo.push("phone");
      successMessage = `OTP has been sent to your ${sentTo.join(" and ")}`;
    } else if (detectedMethod === "email") {
      successMessage = "OTP has been sent to your email address";
    } else if (detectedMethod === "phone") {
      successMessage = "OTP has been sent to your phone number";
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        data: {
          userId: user._id,
          method: detectedMethod,
          sentTo: {
            email: results.email ? user.email : null,
            phone: results.phone ? user.phone : null,
          },
          expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to process request. Please try again.",
      },
      { status: 500 }
    );
  }
}

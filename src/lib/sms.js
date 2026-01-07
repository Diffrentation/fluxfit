import twilio from "twilio";

let cachedClient = null;

/**
 * Send SMS using Twilio
 * @param {string} to - Recipient phone number (with country code, e.g., +919876543210)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendSMS = async (to, message) => {
  try {
    // Validate required fields
    if (!to || !message) {
      throw new Error("Missing required fields: to and message");
    }

    // Normalize phone number format (ensure it starts with +)
    let normalizedPhone = to.trim();
    if (!normalizedPhone.startsWith("+")) {
      // If it doesn't start with +, assume it's Indian number and add +91
      if (normalizedPhone.startsWith("91")) {
        normalizedPhone = "+" + normalizedPhone;
      } else if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+91" + normalizedPhone.substring(1);
      } else {
        normalizedPhone = "+91" + normalizedPhone;
      }
    }

    console.log(`📱 Attempting to send SMS to: ${normalizedPhone}`);

    // Validate Twilio configuration
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.warn("⚠️ Twilio configuration is missing. SMS will not be sent.");
      console.log(`📱 [SMS Mock] To: ${normalizedPhone}, Message: ${message}`);
      return {
        success: false,
        mock: true,
        error: "Twilio configuration is missing",
        message: "SMS mocked (Twilio not configured)",
      };
    }

    console.log(
      `📱 Twilio Config - Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(
        0,
        10
      )}...`
    );
    console.log(
      `📱 Twilio Config - From Number: ${process.env.TWILIO_PHONE_NUMBER}`
    );

    // Create (or reuse) Twilio client
    if (!cachedClient) {
      cachedClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    console.log(`📱 Sending SMS via Twilio...`);
    const result = await cachedClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });

    console.log("✅ SMS sent successfully!");
    console.log(`📱 Message SID: ${result.sid}`);
    console.log(`📱 Status: ${result.status}`);
    console.log(`📱 To: ${result.to}`);
    console.log(`📱 From: ${result.from}`);

    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from,
      message: "SMS sent successfully",
    };
  } catch (error) {
    console.error("❌ Error sending SMS:");
    console.error(`📱 Error Code: ${error.code}`);
    console.error(`📱 Error Message: ${error.message}`);
    console.error(`📱 Error Details:`, error);

    // Provide more specific error messages
    let errorMessage = "Failed to send SMS";
    if (error.code === 21211) {
      errorMessage =
        "Invalid phone number format. Please use format: +919876543210";
    } else if (error.code === 21608) {
      errorMessage =
        "Twilio phone number not verified. Please verify your Twilio number.";
    } else if (error.code === 21614) {
      errorMessage =
        "Invalid 'To' phone number. Please check the phone number format.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      message: errorMessage,
    };
  }
};

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP code
 * @param {string} type - Type of OTP (email-verification, password-reset, etc.)
 * @returns {Promise<Object>} - Result object
 */
export const sendOTPSMS = async (phoneNumber, otp, type = "password-reset") => {
  const messageMap = {
    "email-verification": `Your FluxFit verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    "password-reset": `Your FluxFit password reset code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    login: `Your FluxFit login code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
  };

  const message =
    messageMap[type] ||
    `Your FluxFit verification code is: ${otp}. Valid for 10 minutes.`;

  return await sendSMS(phoneNumber, message);
};

const smsService = {
  sendSMS,
  sendOTPSMS,
};

export default smsService;

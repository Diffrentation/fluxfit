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

    // Validate Twilio configuration
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.warn("⚠️ Twilio configuration is missing. SMS will not be sent.");
      console.log(`📱 [SMS Mock] To: ${to}, Message: ${message}`);
      return {
        success: true,
        mock: true,
        message: "SMS mocked (Twilio not configured)",
      };
    }

    // Create (or reuse) Twilio client
    if (!cachedClient) {
      cachedClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    const result = await cachedClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("✅ SMS sent successfully:", result.sid);
    return {
      success: true,
      sid: result.sid,
      message: "SMS sent successfully",
    };
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send SMS",
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

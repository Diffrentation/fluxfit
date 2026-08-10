import twilio from "twilio";
import connectDB from "@/lib/db";
import SMSTemplate from "@/models/smstemplate.model";

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

  // Prefer the admin-editable template (SMSTemplate, type "otp") over the
  // hardcoded copy above, so editing it in Admin Settings actually changes
  // what's sent. Falls back to the hardcoded message if none is configured
  // or the DB lookup fails, so OTP delivery never breaks over this.
  let message = messageMap[type] || `Your FluxFit verification code is: ${otp}. Valid for 10 minutes.`;
  try {
    await connectDB();
    const template = await SMSTemplate.findOne({ type: "otp", isActive: true });
    if (template) {
      message = template.render({ otp, type });
    }
  } catch (err) {
    console.error("Failed to load SMS template, using default copy:", err);
  }

  return await sendSMS(phoneNumber, message);
};

const ORDER_STATUS_SMS_TEMPLATE_TYPE = {
  shipped: "order-shipped",
  delivered: "order-delivered",
};

/**
 * Send an order status-change SMS (return approved/rejected, refund processed,
 * partial cancel, etc). Mirrors sendOrderStatusUpdateEmail's template lookup:
 * prefers an admin-edited SMSTemplate for the mapped type, falls back to a
 * short hardcoded message so delivery never breaks over a missing template.
 * @param {string} phoneNumber - Recipient phone number
 * @param {Object} orderData
 * @param {string} orderData.orderId - Order number shown to the customer
 * @param {string} orderData.status - New order status
 * @param {string} [orderData.note] - Optional extra detail
 * @returns {Promise<Object>} - Result object
 */
export const sendOrderStatusUpdateSMS = async (phoneNumber, orderData) => {
  const { orderId, status, note } = orderData;
  const templateType = ORDER_STATUS_SMS_TEMPLATE_TYPE[status] || "order-status-update";

  let message = `FluxFit: Your order #${orderId} is now "${status}".${note ? ` ${note}` : ""}`;
  try {
    await connectDB();
    const template = await SMSTemplate.findOne({ type: templateType, isActive: true });
    if (template) {
      message = template.render({ orderId, status, note: note || "" });
    }
  } catch (err) {
    console.error("Failed to load order-status SMS template, using default copy:", err);
  }

  return await sendSMS(phoneNumber, message);
};

const smsService = {
  sendSMS,
  sendOTPSMS,
  sendOrderStatusUpdateSMS,
};

export default smsService;

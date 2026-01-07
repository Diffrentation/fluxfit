import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
let razorpayInstance = null;

export function getRazorpayInstance() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

/**
 * Create Razorpay order
 * @param {Number} amount - Amount in paise (smallest currency unit)
 * @param {String} currency - Currency code (default: INR)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Razorpay order object
 */
export async function createRazorpayOrder(
  amount,
  currency = "INR",
  options = {}
) {
  try {
    const razorpay = getRazorpayInstance();

    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {},
      ...options,
    };

    const order = await razorpay.orders.create(orderOptions);
    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error(error.description || "Failed to create Razorpay order");
  }
}

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} True if signature is valid
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    // Create signature string
    const text = `${orderId}|${paymentId}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return false;
  }
}

/**
 * Fetch Razorpay payment details
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function getRazorpayPayment(paymentId) {
  try {
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Razorpay payment fetch error:", error);
    throw new Error(error.description || "Failed to fetch payment details");
  }
}

/**
 * Refund Razorpay payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund in paise
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Refund details
 */
export async function refundRazorpayPayment(paymentId, amount, options = {}) {
  try {
    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      ...options,
    });
    return refund;
  } catch (error) {
    console.error("Razorpay refund error:", error);
    throw new Error(error.description || "Failed to process refund");
  }
}

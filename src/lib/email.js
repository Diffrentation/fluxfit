import nodemailer from "nodemailer";
import connectDB from "@/lib/db";
import EmailTemplate from "@/models/emailtemplate.model";

/**
 * Look up an active, admin-edited EmailTemplate for `type` and render it with
 * `variables` (using the model's own {{tag}} substitution). Returns null if
 * none is configured or the lookup fails, so callers can fall back to their
 * hardcoded HTML — this is what actually makes editing a template in Admin
 * Settings affect what gets sent, instead of it being ignored.
 */
async function renderEmailTemplate(type, variables) {
  try {
    await connectDB();
    const template = await EmailTemplate.findOne({ type, isActive: true });
    if (!template) return null;
    return template.render(variables);
  } catch (err) {
    console.error(`Failed to load "${type}" email template, using default copy:`, err);
    return null;
  }
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.from - Sender email (optional, defaults to SENDER_EMAIL)
 * @returns {Promise<Object>} - Result object with success status and message
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from = process.env.SENDER_EMAIL || "bbhupender100@gmail.com",
}) => {
  try {
    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      throw new Error(
        "Missing required email fields: to, subject, and html/text"
      );
    }

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        "Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env"
      );
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"FluxFit" <${from}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML if text not provided
      html,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send email",
    };
  }
};

/**
 * Send OTP email for verification
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - Type of OTP (email-verification, password-reset, etc.)
 * @returns {Promise<Object>} - Result object
 */
export const sendOTPEmail = async (email, otp, type = "email-verification") => {
  const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");
  const subjectMap = {
    "email-verification": "Verify Your Email - FluxFit",
    "password-reset": "Reset Your Password - FluxFit",
    login: "Login OTP - FluxFit",
  };

  const customTemplate = await renderEmailTemplate(type, {
    otp,
    otpExpiryMinutes: OTP_EXPIRY_MINUTES,
  });
  if (customTemplate) {
    return await sendEmail({
      to: email,
      subject: customTemplate.subject,
      html: customTemplate.body,
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subjectMap[type] || "OTP Verification"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">${
          subjectMap[type] || "OTP Verification"
        }</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes. Please do not share this code with anyone.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: subjectMap[type] || "OTP Verification - FluxFit",
    html,
  });
};

/**
 * Send order confirmation email
 * @param {string} email - Recipient email
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} - Result object
 */
export const sendOrderConfirmationEmail = async (email, orderData) => {
  const customTemplate = await renderEmailTemplate("order-confirmation", {
    customerName: orderData.customerName || "Customer",
    orderId: orderData.orderId,
    orderDate: orderData.orderDate || new Date().toLocaleDateString(),
    totalAmount: orderData.totalAmount || 0,
  });
  if (customTemplate) {
    return await sendEmail({
      to: email,
      subject: customTemplate.subject,
      html: customTemplate.body,
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Order Confirmation</h2>
        <p>Hello ${orderData.customerName || "Customer"},</p>
        <p>Thank you for your order! Your order has been confirmed.</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Order Date:</strong> ${
            orderData.orderDate || new Date().toLocaleDateString()
          }</p>
          <p><strong>Total Amount:</strong> ₹${orderData.totalAmount || 0}</p>
        </div>
        <p>We'll send you another email when your order ships.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Order Confirmation - Order #${orderData.orderId}`,
    html,
  });
};

/**
 * Send welcome email to newly registered user
 * @param {string} email - Recipient email
 * @param {Object} userData - User information
 * @returns {Promise<Object>} - Result object
 */
export const sendWelcomeEmail = async (email, userData) => {
  const customTemplate = await renderEmailTemplate("welcome", {
    firstname: userData.firstname || "",
    lastname: userData.lastname || "",
    email,
  });
  if (customTemplate) {
    return await sendEmail({
      to: email,
      subject: customTemplate.subject,
      html: customTemplate.body,
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Welcome to FluxFit!</h2>
        <p>Hello <strong>${userData.firstname || ""} ${
    userData.lastname || ""
  }</strong>,</p>
        <p>Thank you for joining FluxFit! Your email has been successfully verified.</p>
        <p>We're excited to have you as part of our community. You can now:</p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Browse our collection of custom clothing</li>
          <li>Create personalized designs</li>
          <li>Place orders and track them</li>
          <li>Save your favorite products to wishlist</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.NEXT_PUBLIC_APP_URL || "https://fluxfit.com"
          }" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping</a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Welcome to FluxFit - Your Account is Verified!",
    html,
  });
};

/**
 * Send owner notification email about new user registration
 * @param {string} ownerEmail - Owner email address
 * @param {Object} userData - New user information
 * @param {string} eventType - Type of event (registered, logged_in, etc.)
 * @returns {Promise<Object>} - Result object
 */
export const sendOwnerNotificationEmail = async (
  ownerEmail,
  userData,
  eventType = "registered"
) => {
  const eventMessages = {
    registered: "A new user has registered on FluxFit",
    logged_in: "A user has logged in to FluxFit",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${eventMessages[eventType] || "User Activity Notification"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit Admin</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">${
          eventMessages[eventType] || "User Activity Notification"
        }</h2>
        <p>Hello,</p>
        <p>${
          eventMessages[eventType] || "A user activity has occurred on FluxFit"
        }:</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${userData.firstname || ""} ${
    userData.lastname || ""
  }</p>
          <p><strong>Email:</strong> ${userData.email || ""}</p>
          <p><strong>Phone:</strong> ${userData.phone || "Not provided"}</p>
          <p><strong>Role:</strong> ${userData.role || "buyer"}</p>
          ${
            userData.address
              ? `
            <p><strong>Address:</strong> ${userData.address.city || ""}, ${
                  userData.address.state || ""
                }, ${userData.address.country || ""} - ${
                  userData.address.pincode || ""
                }</p>
          `
              : ""
          }
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated notification email from FluxFit.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject: `${eventMessages[eventType] || "User Activity"} - FluxFit`,
    html,
  });
};

/**
 * Send order status update email to customer (used by admin order actions:
 * status change, partial cancel, return approve/reject, refund processed).
 * @param {string} email - Recipient email
 * @param {Object} orderData - Order details
 * @param {string} orderData.orderId - Order number
 * @param {string} orderData.status - New order status
 * @param {string} [orderData.customerName] - Customer name
 * @param {string} [orderData.note] - Extra note describing what changed
 * @returns {Promise<Object>} - Result object
 */
// EmailTemplate's `type` enum only has dedicated statuses for shipped/
// delivered/cancelled — other statuses (confirmed, processing, returned,
// refunded, ...) have no matching admin-editable template, so those keep
// using the generic hardcoded copy below.
const ORDER_STATUS_TEMPLATE_TYPE = {
  shipped: "order-shipped",
  delivered: "order-delivered",
  cancelled: "order-cancelled",
};

export const sendOrderStatusUpdateEmail = async (email, orderData) => {
  const { orderId, status, customerName, note } = orderData;

  const templateType = ORDER_STATUS_TEMPLATE_TYPE[status];
  if (templateType) {
    const customTemplate = await renderEmailTemplate(templateType, {
      orderId,
      status,
      customerName: customerName || "Customer",
      note: note || "",
    });
    if (customTemplate) {
      return await sendEmail({
        to: email,
        subject: customTemplate.subject,
        html: customTemplate.body,
      });
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Your Order Has Been Updated</h2>
        <p>Hello ${customerName || "Customer"},</p>
        <p>There's an update on your order:</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>New Status:</strong> <span style="text-transform: capitalize;">${status}</span></p>
          ${note ? `<p><strong>Details:</strong> ${note}</p>` : ""}
        </div>
        <p>If you have any questions about this update, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Order Update - Order #${orderId}`,
    html,
  });
};

/**
 * Send an admin-initiated password reset notification containing the new
 * password so the user can log in and change it.
 * @param {string} email - Recipient email
 * @param {Object} userData - User information
 * @param {string} userData.newPassword - The new password set by the admin
 * @param {string} [userData.firstname] - User's first name
 * @returns {Promise<Object>} - Result object
 *
 * Uses its own "admin-password-reset" EmailTemplate type — deliberately
 * separate from "password-reset" (sendOTPEmail's {{otp}}-based self-service
 * flow) so an admin editing one can't silently break the other; each type
 * is substituted with a different, non-overlapping set of variables.
 */
export const sendAdminPasswordResetEmail = async (email, userData) => {
  const { newPassword, firstname } = userData;

  const customTemplate = await renderEmailTemplate("admin-password-reset", {
    newPassword,
    firstname: firstname || "",
  });
  if (customTemplate) {
    return await sendEmail({
      to: email,
      subject: customTemplate.subject,
      html: customTemplate.body,
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Password Has Been Reset - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Your Password Has Been Reset</h2>
        <p>Hello ${firstname || "there"},</p>
        <p>An administrator has reset your FluxFit account password. Your new temporary password is:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="color: #667eea; font-size: 24px; letter-spacing: 2px; font-weight: bold;">${newPassword}</span>
        </div>
        <p>Please log in and change this password as soon as possible. If you did not expect this change, contact our support team immediately.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Your Password Has Been Reset - FluxFit",
    html,
  });
};

/**
 * Send an abandoned-cart recovery email listing what's still in the cart.
 * @param {string} email - Recipient email
 * @param {Object} cartData
 * @param {string} [cartData.customerName]
 * @param {Array<{name: string, quantity: number, price: number}>} cartData.items
 * @param {number} cartData.cartTotal
 * @param {string} [cartData.cartUrl] - Link back to the cart page
 * @returns {Promise<Object>} - Result object
 */
export const sendCartRecoveryEmail = async (email, cartData) => {
  const { customerName, items = [], cartTotal, cartUrl } = cartData;
  const link = cartUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://fluxfit.com"}/cart`;

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: center;">×${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.price}</td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You left something in your cart - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">You left something behind!</h2>
        <p>Hello ${customerName || "there"},</p>
        <p>Your cart is waiting for you — here's what you left:</p>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 5px; margin: 20px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #667eea;">Item</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #667eea;">Qty</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #667eea;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="text-align: right; font-weight: bold; font-size: 16px;">Total: ₹${cartTotal}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Purchase</a>
        </div>
        <p>Don't wait too long — your items may sell out!</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "You left something in your cart - FluxFit",
    html,
  });
};

export const sendChallengeEmail = async (email, type, challengeData) => {
  let subject = "";
  let htmlBody = "";

  if (type === "registration") {
    subject = "You're officially in! 🔥 5K Challenge";
    htmlBody = `
      <h2>You're officially in! 🔥</h2>
      <p>Hello ${challengeData.name},</p>
      <p>Your spot for the Fluxfit 5K Challenge has been confirmed.</p>
      <ul>
        <li><strong>Challenge ID:</strong> ${challengeData.challengeId}</li>
        <li><strong>Deadline:</strong> ${new Date(challengeData.deadline).toLocaleDateString()}</li>
      </ul>
      <p>Remember to keep your profile public and tag @FluxfitOfficial with #Fluxfit5K.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://fluxfit.com"}/5k-challenge/dashboard">Go to Dashboard</a>
    `;
  } else if (type === "reminder-5") {
    subject = "Day 5 Reminder: 5K Challenge";
    htmlBody = `<p>Hey ${challengeData.name}, 5 days have passed. Have you posted your Reel yet? Log into your dashboard to submit your link!</p>`;
  } else if (type === "reminder-10") {
    subject = "Day 10 Reminder: 5K Challenge";
    htmlBody = `<p>Hey ${challengeData.name}, only 5 days left in your challenge! Don't miss out on your refund.</p>`;
  } else if (type === "completion") {
    subject = "YOU DID IT! 🔥 5K Challenge Completed";
    htmlBody = `<p>Congratulations ${challengeData.name}! Your views have been verified and your 100% refund is being processed.</p>`;
  } else if (type === "rejection") {
    subject = "5K Challenge Update";
    htmlBody = `<p>Hi ${challengeData.name}, unfortunately your submission was rejected. Reason: ${challengeData.notes?.admin || "Did not meet criteria"}</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e9a58; padding: 20px; text-align: center; color: white;">
        <h1>Fluxfit 5K Challenge</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
        ${htmlBody}
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

const emailService = {
  sendEmail,
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendCartRecoveryEmail,
  sendOwnerNotificationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminPasswordResetEmail,
  sendChallengeEmail,
};

export default emailService;

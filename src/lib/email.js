import nodemailer from "nodemailer";

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
 * Send password reset email with reset link
 * @param {string} email - Recipient email
 * @param {string} resetLink - Password reset link
 * @returns {Promise<Object>} - Result object
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
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
    subject: "Reset Your Password - FluxFit",
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

const emailService = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendOwnerNotificationEmail,
};

export default emailService;

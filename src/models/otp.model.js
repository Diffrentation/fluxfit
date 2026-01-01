import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["email-verification", "password-reset", "login"],
      required: true,
      default: "email-verification",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
      max: 5, // Maximum verification attempts
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
otpSchema.index({ userId: 1, type: 1, isUsed: 1 });
otpSchema.index({ email: 1, type: 1, isUsed: 1 });
otpSchema.index({ otp: 1, email: 1 });

// TTL index - automatically delete documents after expiresAt time
// MongoDB will automatically delete documents when expiresAt time is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate and save OTP
otpSchema.statics.generateOTP = async function (
  userId,
  email,
  type = "email-verification",
  expiryMinutes = 10
) {
  // Delete any existing unused OTPs for this user and type
  await this.deleteMany({
    userId,
    type,
    isUsed: false,
  });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Create and save OTP
  const otpDoc = await this.create({
    userId,
    email: email.toLowerCase(),
    otp,
    type,
    expiresAt,
  });

  return otpDoc.otp;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (
  email,
  otp,
  type = "email-verification"
) {
  const otpDoc = await this.findOne({
    email: email.toLowerCase(),
    otp,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }, // Not expired
  });

  if (!otpDoc) {
    // Increment attempts if OTP document exists but doesn't match
    const existingOtp = await this.findOne({
      email: email.toLowerCase(),
      type,
      isUsed: false,
    });

    if (existingOtp) {
      existingOtp.attempts += 1;
      if (existingOtp.attempts >= 5) {
        // Mark as used if too many attempts
        existingOtp.isUsed = true;
      }
      await existingOtp.save();
    }

    return { valid: false, message: "Invalid or expired OTP" };
  }

  // Check if too many attempts
  if (otpDoc.attempts >= 5) {
    otpDoc.isUsed = true;
    await otpDoc.save();
    return {
      valid: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  otpDoc.attempts += 1;
  await otpDoc.save();

  return { valid: true, userId: otpDoc.userId };
};

// Static method to get active OTP for a user
otpSchema.statics.getActiveOTP = async function (
  userId,
  type = "email-verification"
) {
  return await this.findOne({
    userId,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to delete expired OTPs (cleanup - though TTL index handles this automatically)
otpSchema.statics.deleteExpiredOTPs = async function () {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Static method to delete all OTPs for a user
otpSchema.statics.deleteUserOTPs = async function (userId, type = null) {
  const query = { userId };
  if (type) {
    query.type = type;
  }
  return await this.deleteMany(query);
};

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;

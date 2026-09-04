import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "./otp.model.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username must be at most 20 characters long"],
      index: true,
    },

    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email address",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [32, "Password must be at most 32 characters long"],
      select: false, // Don't return password by default
    },

    role: {
      type: String,
      enum: ["buyer", "admin"],
      default: "buyer",
      index: true,
    },

    token: {
      type: String,
      default: null,
    },

    /** Long-lived refresh token (JWT string); httpOnly cookie mirrors session */
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    profileimage: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    isverified: {
      type: Boolean,
      default: false,
    },

    isblocked: {
      type: Boolean,
      default: false,
    },

    isdeleted: {
      type: Boolean,
      default: false,
    },

    address: {
      addressLine1: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, default: "India" },
      pincode: { type: String, trim: true },
    },

    // Additional fields for admin users
    adminPermissions: {
      type: [String],
      default: [],
      enum: [
        "products",
        "categories",
        "orders",
        "users",
        "coupons",
        "payments",
        "settings",
        "reports",
        "analytics",
      ],
    },

    // Last login tracking
    lastLogin: {
      type: Date,
      default: null,
    },

    // Password reset token and expiry
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Verification expiry - unverified users will be deleted after this time
    verificationExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        return ret;
      },
    },
  },
);

// Hash password before saving (for both admin and buyer)
// Use promise-style middleware (no `next` with async fn)
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  // Hash password with cost of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password (for both admin and buyer)
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

const getJwtSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Access token lasts for the full user session.
userSchema.methods.generateAccessToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    username: this.username,
    role: this.role,
    type: "access",
  };
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

// Long-lived refresh token (httpOnly cookie + DB; role included for edge middleware)
userSchema.methods.generateRefreshToken = function () {
  const payload = {
    userId: this._id,
    role: this.role,
    type: "refresh",
  };
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

userSchema.methods.generateTokenPair = function () {
  const accessToken = this.generateAccessToken();
  const refreshToken = this.generateRefreshToken();
  this.token = accessToken;
  this.refreshToken = refreshToken;
  return { accessToken, refreshToken };
};

/** @returns access token string (legacy callers) */
userSchema.methods.generateAuthToken = function () {
  const { accessToken } = this.generateTokenPair();
  return accessToken;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = jwt.sign(
    { userId: this._id, type: "password-reset" },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "1h" },
  );

  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  return resetToken;
};

// Method to generate OTP for email verification (uses separate OTP model)
userSchema.methods.generateOTP = async function (
  type = "email-verification",
  expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "5"),
) {
  return await OTP.generateOTP(this._id, this.email, type, expiryMinutes);
};

// Method to verify OTP (uses separate OTP model)
userSchema.methods.verifyOTP = async function (
  enteredOTP,
  type = "email-verification",
) {
  return await OTP.verifyOTP(this.email, enteredOTP, type);
};

// Static method to find user by email or username (for login)
userSchema.statics.findByCredentials = async function (
  emailOrUsername,
  password,
) {
  // Try to find by email first, then by username
  let user = await this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername.toLowerCase() },
    ],
    isdeleted: false,
  }).select("+password");

  if (!user) {
    throw new Error("Invalid login credentials");
  }

  // Check if user is blocked
  if (user.isblocked) {
    throw new Error("Account is blocked. Please contact support.");
  }

  // Compare password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new Error("Invalid login credentials");
  }

  // Update last login
  user.lastLogin = new Date();
  // Note: caller (login route) will call user.save() after generateTokenPair
  return user;
};

// Static method to find admin user
userSchema.statics.findAdminByCredentials = async function (
  emailOrUsername,
  password,
) {
  const user = await this.findByCredentials(emailOrUsername, password);

  if (user.role !== "admin") {
    throw new Error("Access denied. Admin privileges required.");
  }

  return user;
};

// Static method to find buyer/local user
userSchema.statics.findBuyerByCredentials = async function (
  emailOrUsername,
  password,
) {
  const user = await this.findByCredentials(emailOrUsername, password);

  if (user.role !== "buyer") {
    throw new Error("Access denied. Buyer account required.");
  }
  return user;
};

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Method to check if user is buyer
userSchema.methods.isBuyer = function () {
  return this.role === "buyer";
};

// Method to get full name
userSchema.methods.getFullName = function () {
  return `${this.firstname} ${this.lastname}`.trim();
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// Indexes for better query performance
userSchema.index({ email: 1, role: 1 });
userSchema.index({ username: 1, role: 1 });
userSchema.index({ role: 1, isblocked: 1, isdeleted: 1 });

// TTL index to automatically delete unverified users after verificationExpiresAt
// MongoDB will automatically delete documents when verificationExpiresAt is reached
// Only applies to unverified users (isverified: false)
userSchema.index(
  { verificationExpiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      isverified: false,
      verificationExpiresAt: { $exists: true },
    },
  },
);

// Static method to manually delete expired unverified users (backup cleanup)
userSchema.statics.deleteExpiredUnverifiedUsers = async function () {
  const result = await this.deleteMany({
    isverified: false,
    verificationExpiresAt: { $lt: new Date(), $ne: null },
  });
  console.log(`🗑️ Deleted ${result.deletedCount} expired unverified users`);
  return result;
};

// Static method to set verification expiry for a user
userSchema.statics.setVerificationExpiry = async function (
  userId,
  expiryMinutes = parseInt(process.env.USER_EXPIRY_MINUTES || "5"),
) {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return await this.findByIdAndUpdate(
    userId,
    { verificationExpiresAt: expiresAt },
    { new: true },
  );
};

// Check if model is already compiled to avoid OverwriteModelError in development
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

import mongoose from "mongoose";
import crypto from "crypto";

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secret: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["public", "private", "webhook"],
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "read",
          "write",
          "delete",
          "admin",
          "products",
          "orders",
          "payments",
          "users",
        ],
      },
    ],
    // Rate limiting
    rateLimit: {
      requests: { type: Number, default: 100 },
      period: { type: String, enum: ["minute", "hour", "day"], default: "minute" },
    },
    // Usage tracking
    usage: {
      count: { type: Number, default: 0 },
      lastUsed: { type: Date, default: null },
    },
    // Validity
    expiresAt: {
      type: Date,
      default: null,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // IP Whitelist
    allowedIPs: [
      {
        type: String,
        trim: true,
      },
    ],
    // Webhook URL (for webhook type)
    webhookUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: "Invalid webhook URL",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
apiKeySchema.index({ key: 1, isActive: 1 });
apiKeySchema.index({ type: 1, isActive: 1 });

// Virtual for is valid
apiKeySchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

// Static method to generate API key
apiKeySchema.statics.generate = function (name, type = "public", permissions = []) {
  const key = `pk_${crypto.randomBytes(32).toString("hex")}`;
  const secret = `sk_${crypto.randomBytes(32).toString("hex")}`;

  return {
    name,
    key,
    secret,
    type,
    permissions,
  };
};

// Method to increment usage
apiKeySchema.methods.incrementUsage = function () {
  this.usage.count += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Method to check rate limit
apiKeySchema.methods.checkRateLimit = function () {
  // This would typically be checked against Redis or similar
  // For now, just return true
  return true;
};

// Method to validate IP
apiKeySchema.methods.validateIP = function (ip) {
  if (this.allowedIPs.length === 0) return true;
  return this.allowedIPs.includes(ip);
};

const APIKey = mongoose.model("APIKey", apiKeySchema);
export default APIKey;


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
    // Current rate-limit window — tracked in Mongo (not in-process memory) so
    // the limit is enforced correctly even across multiple serverless
    // instances, since they all share the same database.
    rateLimitWindow: {
      windowStart: { type: Date, default: null },
      count: { type: Number, default: 0 },
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

const RATE_LIMIT_PERIOD_MS = { minute: 60 * 1000, hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000 };

// Atomically consume one request against this key's configured rate limit,
// using conditional findOneAndUpdate calls so concurrent requests (including
// across separate serverless instances) can't both slip past the limit.
apiKeySchema.methods.consumeRateLimit = async function () {
  const periodMs = RATE_LIMIT_PERIOD_MS[this.rateLimit.period] || RATE_LIMIT_PERIOD_MS.minute;
  const limit = this.rateLimit.requests;
  const now = new Date();
  const windowFloor = new Date(now.getTime() - periodMs);

  // First, try to increment within an existing, still-valid window.
  const incremented = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      "rateLimitWindow.windowStart": { $gte: windowFloor },
      "rateLimitWindow.count": { $lt: limit },
    },
    { $inc: { "rateLimitWindow.count": 1 } },
    { new: true }
  );
  if (incremented) {
    return {
      allowed: true,
      remaining: Math.max(0, limit - incremented.rateLimitWindow.count),
      resetAt: new Date(incremented.rateLimitWindow.windowStart.getTime() + periodMs),
    };
  }

  // No existing valid window matched — either this is the first request ever,
  // the previous window expired, or the window is full. Try starting a fresh
  // window (only succeeds if the window is genuinely missing/expired).
  const started = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      $or: [
        { "rateLimitWindow.windowStart": null },
        { "rateLimitWindow.windowStart": { $lt: windowFloor } },
      ],
    },
    { $set: { "rateLimitWindow.windowStart": now, "rateLimitWindow.count": 1 } },
    { new: true }
  );
  if (started) {
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now.getTime() + periodMs) };
  }

  // Window is valid but full (or a concurrent request just filled it).
  const current = await this.constructor.findById(this._id).select("rateLimitWindow");
  const resetAt = current?.rateLimitWindow?.windowStart
    ? new Date(current.rateLimitWindow.windowStart.getTime() + periodMs)
    : new Date(now.getTime() + periodMs);
  return { allowed: false, remaining: 0, resetAt };
};

// Method to validate IP
apiKeySchema.methods.validateIP = function (ip) {
  if (this.allowedIPs.length === 0) return true;
  return this.allowedIPs.includes(ip);
};

const APIKey = mongoose.models.APIKey || mongoose.model("APIKey", apiKeySchema);
export default APIKey;


import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      enum: [
        "user",
        "product",
        "order",
        "payment",
        "coupon",
        "category",
        "brand",
        "review",
        "settings",
        "other",
      ],
      default: "other",
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true,
    },
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Static method to log activity
activityLogSchema.statics.log = async function (data) {
  const {
    user,
    action,
    entity = "other",
    entityId = null,
    description,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    status = "success",
    error = null,
  } = data;

  return await this.create({
    user,
    action,
    entity,
    entityId,
    description,
    metadata,
    ipAddress,
    userAgent,
    status,
    error,
  });
};

// Static method to get user activity
activityLogSchema.statics.getUserActivity = async function (
  userId,
  limit = 50,
  page = 1
) {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ user: userId }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Static method to get entity activity
activityLogSchema.statics.getEntityActivity = async function (
  entity,
  entityId,
  limit = 50
) {
  return await this.find({
    entity,
    entityId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;


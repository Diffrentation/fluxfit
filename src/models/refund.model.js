import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Refund Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["full", "partial"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Items (for partial refunds)
    items: [
      {
        orderItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    // Processing
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
    },
    // Gateway Information
    refundId: {
      type: String,
      default: null,
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Timeline
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
refundSchema.index({ user: 1, createdAt: -1 });
refundSchema.index({ order: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

// Method to approve refund
refundSchema.methods.approve = function (approvedBy) {
  this.status = "approved";
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.statusHistory.push({
    status: "approved",
    timestamp: new Date(),
    note: "Refund approved",
    updatedBy: approvedBy,
  });
  return this.save();
};

// Method to reject refund
refundSchema.methods.reject = function (rejectedBy, reason) {
  this.status = "rejected";
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.statusHistory.push({
    status: "rejected",
    timestamp: new Date(),
    note: reason,
    updatedBy: rejectedBy,
  });
  return this.save();
};

// Method to mark as processing
refundSchema.methods.markProcessing = function () {
  this.status = "processing";
  this.statusHistory.push({
    status: "processing",
    timestamp: new Date(),
    note: "Refund processing started",
  });
  return this.save();
};

// Method to mark as completed
refundSchema.methods.markCompleted = function (refundId = null, transactionId = null, gatewayResponse = null) {
  this.status = "completed";
  this.processedAt = new Date();
  if (refundId) this.refundId = refundId;
  if (transactionId) this.transactionId = transactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  this.statusHistory.push({
    status: "completed",
    timestamp: new Date(),
    note: "Refund completed",
  });
  return this.save();
};

refundSchema.pre("save", function () {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: "Refund requested",
    });
  }
});

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;


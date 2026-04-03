import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    method: {
      type: String,
      enum: ["card", "upi", "netbanking", "cod", "razorpay", "stripe", "paypal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    // Gateway Information
    gateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "cod", "other"],
      default: "other",
    },
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    // Payment Response
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    // Failure Information
    failureReason: {
      type: String,
      default: null,
    },
    failureCode: {
      type: String,
      default: null,
    },
    // Refund Information
    refunds: [
      {
        amount: { type: Number, required: true },
        reason: { type: String, default: null },
        refundId: { type: String, default: null },
        status: {
          type: String,
          enum: ["pending", "processing", "completed", "failed"],
          default: "pending",
        },
        processedAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tax Information
    tax: {
      gst: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    // Notes
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentId: 1 });

// Virtual for refundable amount
paymentSchema.virtual("refundableAmount").get(function () {
  return this.amount - this.totalRefunded;
});

// Method to mark as completed
paymentSchema.methods.markCompleted = function (transactionId = null, paymentId = null, gatewayResponse = null) {
  this.status = "completed";
  this.completedAt = new Date();
  if (transactionId) this.transactionId = transactionId;
  if (paymentId) this.paymentId = paymentId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markFailed = function (reason = null, code = null) {
  this.status = "failed";
  this.failedAt = new Date();
  if (reason) this.failureReason = reason;
  if (code) this.failureCode = code;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function (amount, reason = null) {
  if (amount > this.refundableAmount) {
    throw new Error("Refund amount exceeds refundable amount");
  }

  const refund = {
    amount,
    reason,
    status: "pending",
    createdAt: new Date(),
  };

  this.refunds.push(refund);
  this.totalRefunded += amount;

  if (this.totalRefunded >= this.amount) {
    this.status = "refunded";
  }

  return this.save();
};

// Method to update refund status
paymentSchema.methods.updateRefundStatus = function (refundIndex, status, refundId = null) {
  if (this.refunds[refundIndex]) {
    this.refunds[refundIndex].status = status;
    if (refundId) this.refunds[refundIndex].refundId = refundId;
    if (status === "completed") {
      this.refunds[refundIndex].processedAt = new Date();
    }
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function (startDate, endDate) {
  const match = {
    status: "completed",
    completedAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalCount: { $sum: 1 },
        totalRefunded: { $sum: "$totalRefunded" },
        averageAmount: { $avg: "$amount" },
      },
    },
  ]);

  return stats[0] || {
    totalAmount: 0,
    totalCount: 0,
    totalRefunded: 0,
    averageAmount: 0,
  };
};

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;


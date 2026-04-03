import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    // Vendor/Seller (for multi-vendor support)
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Period
    period: {
      startDate: {
        type: Date,
        required: true,
        index: true,
      },
      endDate: {
        type: Date,
        required: true,
        index: true,
      },
    },
    // Financial Summary
    summary: {
      totalSales: { type: Number, default: 0, min: 0 },
      totalOrders: { type: Number, default: 0, min: 0 },
      totalRefunds: { type: Number, default: 0, min: 0 },
      totalCommission: { type: Number, default: 0, min: 0 },
      commissionRate: { type: Number, default: 0, min: 0, max: 100 },
      tax: { type: Number, default: 0, min: 0 },
      fees: { type: Number, default: 0, min: 0 },
      netAmount: { type: Number, default: 0 },
    },
    // Orders included
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    // Payments
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    // Settlement Details
    settlement: {
      method: {
        type: String,
        enum: ["bank", "upi", "wallet", "other"],
        default: "bank",
      },
      accountNumber: { type: String, default: null },
      ifsc: { type: String, default: null },
      upi: { type: String, default: null },
      transactionId: { type: String, default: null },
      processedAt: { type: Date, default: null },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
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
settlementSchema.index({ vendor: 1, "period.startDate": 1, "period.endDate": 1 });
settlementSchema.index({ status: 1, createdAt: -1 });

// Method to calculate summary
settlementSchema.methods.calculateSummary = async function () {
  const Order = mongoose.model("Order");
  const Payment = mongoose.model("Payment");

  // Get orders in period
  const orders = await Order.find({
    _id: { $in: this.orders },
    status: { $in: ["delivered", "completed"] },
  });

  // Get payments
  const payments = await Payment.find({
    _id: { $in: this.payments },
    status: "completed",
  });

  // Calculate totals
  this.summary.totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  this.summary.totalOrders = orders.length;
  this.summary.totalRefunds = payments.reduce(
    (sum, payment) => sum + payment.totalRefunded,
    0
  );

  // Calculate commission
  const commissionAmount =
    (this.summary.totalSales * this.summary.commissionRate) / 100;
  this.summary.totalCommission = commissionAmount;

  // Calculate net amount
  this.summary.netAmount =
    this.summary.totalSales -
    this.summary.totalRefunds -
    this.summary.totalCommission -
    this.summary.tax -
    this.summary.fees;

  return this.save();
};

// Method to mark as completed
settlementSchema.methods.markCompleted = function (transactionId, processedBy) {
  this.status = "completed";
  this.settlement.processedAt = new Date();
  this.settlement.transactionId = transactionId;
  this.settlement.processedBy = processedBy;
  return this.save();
};

const Settlement =
  mongoose.models.Settlement || mongoose.model("Settlement", settlementSchema);
export default Settlement;


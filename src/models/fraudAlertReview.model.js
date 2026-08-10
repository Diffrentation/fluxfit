import mongoose from "mongoose";

// Fraud alerts themselves are computed live from order patterns on every
// request (see /api/admin/finance/fraud-detection) rather than stored —
// this collection is just the persisted "what did an admin decide about
// this alert" overlay, keyed by the alert's deterministic id (e.g.
// "cancel-<userId>"), so a review survives across refreshes/deploys even
// though the alert generation itself is stateless.
const fraudAlertReviewSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["reviewed", "resolved", "false-positive"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FraudAlertReview ||
  mongoose.model("FraudAlertReview", fraudAlertReviewSchema);

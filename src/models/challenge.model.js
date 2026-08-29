import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Nullable if guest checkout
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    socialHandle: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ["instagram", "youtube"],
      default: "instagram",
    },
    videoUrl: {
      type: String,
      unique: true,
      sparse: true, // Only enforces uniqueness if a videoUrl is provided
    },
    status: {
      type: String,
      enum: [
        "registered",
        "active",
        "video_submitted",
        "under_review",
        "qualified",
        "rejected",
        "completed", // when refund is processed
      ],
      default: "registered",
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    agreedToTerms: {
      type: Boolean,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    notes: {
      admin: { type: String, default: null }, // for reject reasons
    },
  },
  {
    timestamps: true,
  }
);

// Method to generate Challenge ID
challengeSchema.statics.generateChallengeId = function () {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FF5K-${random}`;
};

const Challenge = mongoose.models.Challenge || mongoose.model("Challenge", challengeSchema);
export default Challenge;

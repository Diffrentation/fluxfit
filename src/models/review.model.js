import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
      },
    ],
    // Helpful votes
    helpful: {
      count: { type: Number, default: 0 },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "spam"],
      default: "pending",
      index: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
    // Reply from seller/admin
    reply: {
      text: { type: String, default: null },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      repliedAt: { type: Date, default: null },
    },
    // Verified purchase
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ rating: 1, status: 1 });

// Method to mark as helpful
reviewSchema.methods.markHelpful = function (userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unmark as helpful
reviewSchema.methods.unmarkHelpful = function (userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to approve
reviewSchema.methods.approve = function (moderatedBy) {
  this.status = "approved";
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  return this.save();
};

// Method to reject
reviewSchema.methods.reject = function (moderatedBy) {
  this.status = "rejected";
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  return this.save();
};

// Method to add reply
reviewSchema.methods.addReply = function (text, repliedBy) {
  this.reply = {
    text,
    repliedBy,
    repliedAt: new Date(),
  };
  return this.save();
};

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: productId,
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      "rating.average": Math.round(stats[0].averageRating * 10) / 10,
      "rating.count": stats[0].count,
      reviews: stats[0].count,
    });
  }
};

// Post-save middleware to update product rating
reviewSchema.post("save", async function () {
  if (this.status === "approved") {
    await this.constructor.updateProductRating(this.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;


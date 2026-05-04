import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxPurchase: {
      type: Number,
      default: null,
      min: 0,
    },
    // Usage Limits
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Validity
    validFrom: {
      type: Date,
      required: true,
      index: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    // Applicability
    applicableTo: {
      type: String,
      enum: ["all", "categories", "products", "brands"],
      default: "all",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
couponSchema.index({ code: 1, isActive: 1, isDeleted: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1, isActive: 1 });

// Virtual for is valid
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    !this.isDeleted &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Method to validate coupon
couponSchema.methods.validateCoupon = function (cartTotal, userId = null) {
  const now = new Date();

  // Check if active
  if (!this.isActive || this.isDeleted) {
    return { valid: false, message: "Coupon is not active" };
  }

  // Check validity period
  if (now < this.validFrom || now > this.validUntil) {
    return { valid: false, message: "Coupon is expired or not yet valid" };
  }

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  // Check minimum purchase
  if (cartTotal < this.minPurchase) {
    return {
      valid: false,
      message: `Minimum purchase of ₹${this.minPurchase} required`,
    };
  }

  // Check maximum purchase
  if (this.maxPurchase && cartTotal > this.maxPurchase) {
    return {
      valid: false,
      message: `Maximum purchase of ₹${this.maxPurchase} allowed`,
    };
  }

  return { valid: true, message: "Coupon is valid" };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (cartTotal) {
  let discount = 0;

  if (this.type === "percentage") {
    discount = (cartTotal * this.discount) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discount;
    if (discount > cartTotal) {
      discount = cartTotal;
    }
  }

  return discount;
};

// Method to increment usage
couponSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

// Static method to find valid coupon
couponSchema.statics.findValid = async function (
  code,
  cartTotal,
  userId = null
) {
  const coupon = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    isDeleted: false,
  });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  const validation = coupon.validateCoupon(cartTotal, userId);
  if (!validation.valid) {
    return validation;
  }

  return { valid: true, coupon, message: "Coupon is valid" };
};

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
export default Coupon;

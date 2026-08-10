import mongoose from "mongoose";

const designImagesSchema = new mongoose.Schema(
  {
    front: { type: String, default: null },
    back: { type: String, default: null },
    leftSleeve: { type: String, default: null },
    rightSleeve: { type: String, default: null },
  },
  { _id: false }
);

const customClothingOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Clothing configuration
    clothType: {
      type: String,
      required: true,
      enum: [
        "T-Shirt",
        "Polo T-Shirt",
        "Hoodie",
        "Sweatshirt",
        "Shirt",
        "Jacket",
        "Tracksuit",
        "Tank Top",
        "Shorts",
        "Joggers",
      ],
    },
    clothColor: {
      label: { type: String, required: true },
      hex: { type: String, required: true },
    },
    printPlacement: {
      type: String,
      required: true,
      enum: [
        "front",
        "back",
        "left_sleeve",
        "right_sleeve",
        "front_back",
        "full_custom",
      ],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // Uploaded design images (Cloudinary URLs)
    designImages: {
      type: designImagesSchema,
      default: () => ({}),
    },

    // Order lifecycle
    status: {
      type: String,
      enum: [
        "pending_review",
        "approved",
        "rejected",
        "in_production",
        "completed",
      ],
      default: "pending_review",
      index: true,
    },

    // Admin workflow
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },

    // Admin-set price quote — custom orders have no catalog price, so this
    // is how the admin communicates cost before the customer commits to
    // payment. Kept separate from the storefront Order/payment models since
    // custom orders aren't paid through the cart/checkout flow yet.
    quote: {
      pricePerUnit: { type: Number, default: null, min: 0 },
      totalAmount: { type: Number, default: null, min: 0 },
      currency: { type: String, default: "INR" },
      notes: { type: String, trim: true, maxlength: 500, default: "" },
      quotedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      quotedAt: {
        type: Date,
        default: null,
      },
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

customClothingOrderSchema.index({ user: 1, status: 1 });
customClothingOrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.CustomClothingOrder ||
  mongoose.model("CustomClothingOrder", customClothingOrderSchema);

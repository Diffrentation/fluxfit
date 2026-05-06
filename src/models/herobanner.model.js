import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    buttonText: {
      type: String,
      default: "SHOP NOW",
      trim: true,
    },
    buttonLink: {
      type: String,
      default: "/product-list",
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    discountText: {
      type: String,
      default: "",
      trim: true,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    salePrice: {
      type: Number,
      default: null,
    },
    bgColor: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

heroBannerSchema.index({ isActive: 1, order: 1 });

const HeroBanner =
  mongoose.models.HeroBanner ||
  mongoose.model("HeroBanner", heroBannerSchema);

export default HeroBanner;

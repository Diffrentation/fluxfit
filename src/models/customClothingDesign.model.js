import mongoose from "mongoose";

const customClothingDesignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    /** Present only for bundled seed characters — idempotent re-seed */
    seedKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    kind: {
      type: String,
      enum: ["seed", "upload"],
      default: "upload",
    },
  },
  { timestamps: true }
);

customClothingDesignSchema.index({ active: 1, sortOrder: 1 });

export default mongoose.models.CustomClothingDesign ||
  mongoose.model("CustomClothingDesign", customClothingDesignSchema);

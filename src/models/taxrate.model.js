import mongoose from "mongoose";

const taxRateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    type: {
      type: String,
      enum: ["gst", "vat", "sales", "service"],
      default: "gst",
    },
    description: {
      type: String,
      trim: true,
    },
    // Applicability
    applicableTo: {
      type: String,
      enum: ["all", "categories", "products"],
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
    // States/Regions
    states: [
      {
        type: String,
        trim: true,
      },
    ],
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taxRateSchema.index({ code: 1, isActive: 1 });

// Method to check if applicable
taxRateSchema.methods.isApplicable = function (productId = null, categoryId = null, state = null) {
  if (!this.isActive) return false;

  // Check state
  if (this.states.length > 0 && state && !this.states.includes(state)) {
    return false;
  }

  // Check applicability
  if (this.applicableTo === "all") {
    return true;
  } else if (this.applicableTo === "categories" && categoryId) {
    return this.categories.some((cat) => cat.toString() === categoryId.toString());
  } else if (this.applicableTo === "products" && productId) {
    return this.products.some((prod) => prod.toString() === productId.toString());
  }

  return false;
};

const TaxRate = mongoose.models.TaxRate || mongoose.model("TaxRate", taxRateSchema);
export default TaxRate;


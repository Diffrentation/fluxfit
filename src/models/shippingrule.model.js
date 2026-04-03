import mongoose from "mongoose";

const shippingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Applicability
    type: {
      type: String,
      enum: ["flat", "weight", "distance", "price"],
      required: true,
    },
    // Zones/Regions
    zones: [
      {
        name: { type: String, required: true },
        states: [{ type: String, trim: true }],
        cities: [{ type: String, trim: true }],
        pincodes: [{ type: String, trim: true }],
      },
    ],
    // Pricing
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    freeShippingThreshold: {
      type: Number,
      default: null,
      min: 0,
    },
    // Rules based on type
    rules: [
      {
        min: { type: Number, default: 0 },
        max: { type: Number, default: null },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    // Estimated delivery
    estimatedDays: {
      min: { type: Number, default: 3 },
      max: { type: Number, default: 7 },
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shippingRuleSchema.index({ isActive: 1, sortOrder: 1 });

// Method to calculate shipping cost
shippingRuleSchema.methods.calculateCost = function (weight = 0, distance = 0, orderValue = 0) {
  // Check free shipping threshold
  if (this.freeShippingThreshold && orderValue >= this.freeShippingThreshold) {
    return 0;
  }

  // Calculate based on type
  if (this.type === "flat") {
    return this.basePrice;
  } else if (this.type === "weight") {
    // Find applicable rule
    const rule = this.rules.find(
      (r) => weight >= r.min && (!r.max || weight <= r.max)
    );
    return rule ? rule.price : this.basePrice;
  } else if (this.type === "distance") {
    const rule = this.rules.find(
      (r) => distance >= r.min && (!r.max || distance <= r.max)
    );
    return rule ? rule.price : this.basePrice;
  } else if (this.type === "price") {
    const rule = this.rules.find(
      (r) => orderValue >= r.min && (!r.max || orderValue <= r.max)
    );
    return rule ? rule.price : this.basePrice;
  }

  return this.basePrice;
};

const ShippingRule =
  mongoose.models.ShippingRule || mongoose.model("ShippingRule", shippingRuleSchema);
export default ShippingRule;


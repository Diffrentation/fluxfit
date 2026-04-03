import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Website Settings
    website: {
      name: { type: String, default: "FluxFit" },
      logo: { type: String, default: null },
      favicon: { type: String, default: null },
      email: { type: String, default: "fluxfit1@gmail.com" },
      phone: { type: String, default: "+91 9958724005" },
      address: {
        line1: { type: String, default: "Behrampur" },
        line2: { type: String, default: "" },
        city: { type: String, default: "Ghaziabad" },
        state: { type: String, default: "Uttar Pradesh" },
        country: { type: String, default: "India" },
        pincode: { type: String, default: "" },
      },
      socialMedia: {
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" },
        instagram: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        youtube: { type: String, default: "" },
      },
    },
    // Currency & Tax
    currency: {
      code: { type: String, default: "INR" },
      symbol: { type: String, default: "₹" },
      position: { type: String, enum: ["before", "after"], default: "before" },
    },
    tax: {
      enabled: { type: Boolean, default: true },
      defaultRate: { type: Number, default: 18 }, // GST 18%
      inclusive: { type: Boolean, default: false },
    },
    // Shipping
    shipping: {
      freeShippingThreshold: { type: Number, default: 4150 },
      defaultMethod: { type: String, default: "standard" },
      defaultDays: { type: Number, default: 3 },
    },
    // Maintenance
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "We are currently under maintenance. Please check back later." },
    },
    // Email Settings
    email: {
      from: { type: String, default: "noreply@fluxfit.com" },
      fromName: { type: String, default: "FluxFit" },
      replyTo: { type: String, default: "support@fluxfit.com" },
    },
    // SMS Settings
    sms: {
      provider: { type: String, default: null },
      enabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get settings (singleton)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function (updates) {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }

  return settings;
};

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;


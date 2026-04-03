import mongoose from "mongoose";

const smsTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 160, // SMS character limit
    },
    type: {
      type: String,
      enum: [
        "otp",
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "payment-success",
        "payment-failed",
        "custom",
      ],
      required: true,
      index: true,
    },
    variables: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
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
smsTemplateSchema.index({ type: 1, isActive: 1 });

// Method to render template with variables
smsTemplateSchema.methods.render = function (variables = {}) {
  let message = this.message;

  // Replace variables
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    message = message.replace(regex, variables[key] || "");
  });

  return message;
};

const SMSTemplate =
  mongoose.models.SMSTemplate || mongoose.model("SMSTemplate", smsTemplateSchema);
export default SMSTemplate;


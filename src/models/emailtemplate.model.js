import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "welcome",
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "order-cancelled",
        "password-reset",
        "email-verification",
        "payment-success",
        "payment-failed",
        "refund-processed",
        "newsletter",
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
emailTemplateSchema.index({ type: 1, isActive: 1 });

// Method to render template with variables
emailTemplateSchema.methods.render = function (variables = {}) {
  let subject = this.subject;
  let body = this.body;

  // Replace variables in subject
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, variables[key] || "");
    body = body.replace(regex, variables[key] || "");
  });

  return { subject, body };
};

const EmailTemplate =
  mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", emailTemplateSchema);
export default EmailTemplate;


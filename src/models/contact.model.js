import mongoose from "mongoose";

/** Contact moderation / workflow states (admin) */
export const CONTACT_STATUSES = ["pending", "approved", "rejected", "spam"];

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 40,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: "pending",
    },
    /** Set when status is no longer `pending` (reviewed / triaged). */
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

/** Map legacy `resolved` → `approved` (one-time / idempotent). */
export async function migrateLegacyContactStatuses() {
  await Contact.updateMany(
    { status: "resolved" },
    { $set: { status: "approved" } }
  );
}

export default Contact;

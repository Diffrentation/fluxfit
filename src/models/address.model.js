import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
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
addressSchema.index({ user: 1, isDeleted: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

// Method to set as default
addressSchema.methods.setAsDefault = async function () {
  // Unset other default addresses for this user
  await mongoose.model("Address").updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { isDefault: false }
  );

  this.isDefault = true;
  return this.save();
};

// Static method to get default address
addressSchema.statics.getDefault = async function (userId) {
  return await this.findOne({
    user: userId,
    isDefault: true,
    isDeleted: false,
  });
};

const Address = mongoose.models.Address || mongoose.model("Address", addressSchema);
export default Address;


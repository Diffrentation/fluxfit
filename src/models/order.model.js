import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      default: null,
    },
    variant: {
      size: { type: String, default: null },
      color: { type: String, default: null },
      sku: { type: String, default: null },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
    },
    returnRequested: {
      type: Boolean,
      default: false,
    },
    returnReason: {
      type: String,
      default: null,
    },
    refundRequested: {
      type: Boolean,
      default: false,
    },
    refundReason: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    // Address Information
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
      pincode: { type: String, required: true },
      type: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home",
      },
    },
    billingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
      pincode: { type: String, required: true },
    },
    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
      type: { type: String, enum: ["percentage", "fixed"], default: null },
    },
    shipping: {
      method: { type: String, default: "standard" },
      cost: { type: Number, default: 0, min: 0 },
      estimatedDays: { type: Number, default: 3 },
    },
    tax: {
      gst: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    // Payment Information
    payment: {
      method: {
        type: String,
        enum: ["card", "upi", "netbanking", "cod", "razorpay", "stripe", "paypal"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: { type: String, default: null },
      paymentId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
    // Order Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    // Status Timeline
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    // Delivery Information
    delivery: {
      partner: { type: String, default: null },
      trackingNumber: { type: String, default: null },
      estimatedDelivery: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },
    // Cancellation
    cancellation: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: null },
      cancelledAt: { type: Date, default: null },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    // Notes
    notes: {
      customer: { type: String, default: null },
      admin: { type: String, default: null },
    },
    // Invoice
    invoice: {
      number: { type: String, default: null },
      generatedAt: { type: Date, default: null },
      url: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1, status: 1 });

// Virtual for item count
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to generate order number
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Apply coupon discount
  let discount = 0;
  if (this.coupon.code) {
    if (this.coupon.type === "percentage") {
      discount = (this.subtotal * this.coupon.discount) / 100;
    } else {
      discount = this.coupon.discount;
    }
  }

  this.discount = discount;

  // Calculate tax (GST)
  const taxableAmount = this.subtotal - this.discount;
  const gst = (taxableAmount * 18) / 100; // 18% GST
  this.tax.gst = gst;
  this.tax.total = gst;

  // Calculate total
  this.total = taxableAmount + this.tax.total + this.shipping.cost;
};

// Method to update status
orderSchema.methods.updateStatus = function (newStatus, note = "", updatedBy = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  });

  // Update item statuses
  this.items.forEach((item) => {
    if (["cancelled", "returned", "refunded"].includes(newStatus)) {
      item.status = newStatus;
    } else if (["shipped", "delivered"].includes(newStatus)) {
      item.status = newStatus;
    }
  });

  // Set deliveredAt if delivered
  if (newStatus === "delivered") {
    this.delivery.deliveredAt = new Date();
  }
};

// Method to cancel order
orderSchema.methods.cancel = function (reason, cancelledBy = null) {
  this.status = "cancelled";
  this.cancellation.requested = true;
  this.cancellation.reason = reason;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancelledBy = cancelledBy;

  this.updateStatus("cancelled", `Order cancelled: ${reason}`, cancelledBy);
};

// Method to request return
orderSchema.methods.requestReturn = function (itemId, reason) {
  const item = this.items.id(itemId);
  if (item) {
    item.returnRequested = true;
    item.returnReason = reason;
    item.status = "returned";
  }
};

// Method to process refund
orderSchema.methods.processRefund = function (itemId = null, amount = null) {
  if (itemId) {
    const item = this.items.id(itemId);
    if (item) {
      item.refundRequested = true;
      item.status = "refunded";
    }
  } else {
    this.status = "refunded";
    this.payment.status = "refunded";
  }

  this.updateStatus("refunded", "Refund processed");
};

// Runs before required-field validation so orderNumber / subtotal / total exist on first save.
orderSchema.pre("validate", function () {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = this.constructor.generateOrderNumber();
  }

  if (this.isModified("items") || this.isModified("coupon") || this.isNew) {
    this.calculateTotals();
  }
});

orderSchema.pre("save", function () {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order created",
    });
  }
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;


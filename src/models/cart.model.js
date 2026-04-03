import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      size: { type: String, default: null },
      color: { type: String, default: null },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    coupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
      type: { type: String, enum: ["percentage", "fixed"], default: null },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (user already indexed via unique)
cartSchema.index({ "items.product": 1 });

// Virtual for item count
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for subtotal
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual for discount amount
cartSchema.virtual("discountAmount").get(function () {
  if (!this.coupon.code) return 0;

  const subtotal = this.subtotal;
  if (this.coupon.type === "percentage") {
    return (subtotal * this.coupon.discount) / 100;
  } else {
    return this.coupon.discount;
  }
});

// Virtual for total
cartSchema.virtual("total").get(function () {
  return Math.max(0, this.subtotal - this.discountAmount);
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId, variant = {}, quantity = 1, price) {
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product.toString() === productId.toString() &&
      item.variant.size === variant.size &&
      item.variant.color === variant.color
  );

  if (existingItemIndex >= 0) {
    // Update quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      variant,
      quantity,
      price,
      addedAt: new Date(),
    });
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }
    this.lastUpdated = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove item
cartSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId);
  this.lastUpdated = new Date();
  return this.save();
};

// Method to clear cart
cartSchema.methods.clear = function () {
  this.items = [];
  this.coupon = { code: null, discount: 0, type: null };
  this.lastUpdated = new Date();
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function (coupon) {
  this.coupon = {
    code: coupon.code,
    discount: coupon.discount,
    type: coupon.type,
  };
  this.lastUpdated = new Date();
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function () {
  this.coupon = { code: null, discount: 0, type: null };
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create cart
cartSchema.statics.getOrCreate = async function (userId) {
  let cart = await this.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

// No pre("save") hook — `lastUpdated` defaults on create; methods update it before save.
//
// Next.js dev / HMR keeps a global Mongoose singleton. `mongoose.models.Cart || model(...)`
// never re-runs `model()` after the first load, so an old Cart schema (e.g. with a broken
// `pre("save")` using `next`) stays cached and causes "next is not a function".
if (mongoose.models.Cart) {
  mongoose.deleteModel("Cart");
}
const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;


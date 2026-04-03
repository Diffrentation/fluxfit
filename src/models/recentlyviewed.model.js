import mongoose from "mongoose";

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
recentlyViewedSchema.index({ user: 1 });
recentlyViewedSchema.index({ "products.product": 1 });
recentlyViewedSchema.index({ "products.viewedAt": -1 });

// TTL index to automatically remove old entries (30 days)
recentlyViewedSchema.index({ "products.viewedAt": 1 }, { expireAfterSeconds: 2592000 });

// Method to add product
recentlyViewedSchema.methods.addProduct = function (productId) {
  // Remove if already exists
  this.products = this.products.filter(
    (p) => p.product.toString() !== productId.toString()
  );

  // Add to beginning
  this.products.unshift({
    product: productId,
    viewedAt: new Date(),
  });

  // Keep only last 50 products
  if (this.products.length > 50) {
    this.products = this.products.slice(0, 50);
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Method to remove product
recentlyViewedSchema.methods.removeProduct = function (productId) {
  this.products = this.products.filter(
    (p) => p.product.toString() !== productId.toString()
  );
  this.lastUpdated = new Date();
  return this.save();
};

// Method to clear
recentlyViewedSchema.methods.clear = function () {
  this.products = [];
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create
recentlyViewedSchema.statics.getOrCreate = async function (userId) {
  let recentlyViewed = await this.findOne({ user: userId }).populate("products.product");

  if (!recentlyViewed) {
    recentlyViewed = await this.create({ user: userId, products: [] });
  }

  return recentlyViewed;
};

recentlyViewedSchema.pre("save", function () {
  this.lastUpdated = new Date();
});

const RecentlyViewed = mongoose.model("RecentlyViewed", recentlyViewedSchema);
export default RecentlyViewed;


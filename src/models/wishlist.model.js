import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
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
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ "items.product": 1 });

// Virtual for item count
wishlistSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function (productId) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (!existingItem) {
    this.items.push({
      product: productId,
      addedAt: new Date(),
    });
    this.lastUpdated = new Date();
    return this.save();
  }

  return Promise.resolve(this);
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  this.lastUpdated = new Date();
  return this.save();
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
  return this.items.some(
    (item) => item.product.toString() === productId.toString()
  );
};

// Method to clear wishlist
wishlistSchema.methods.clear = function () {
  this.items = [];
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create wishlist
wishlistSchema.statics.getOrCreate = async function (userId) {
  let wishlist = await this.findOne({ user: userId }).populate("items.product");

  if (!wishlist) {
    wishlist = await this.create({ user: userId, items: [] });
  }

  return wishlist;
};

// Pre-save middleware
wishlistSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;


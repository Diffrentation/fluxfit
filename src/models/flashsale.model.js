import mongoose from "mongoose";

const flashSaleSchema = new mongoose.Schema(
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
    // Products on sale
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        discount: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        originalPrice: {
          type: Number,
          required: true,
        },
        salePrice: {
          type: Number,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Schedule
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    // Banner
    banner: {
      type: String,
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ["scheduled", "active", "ended", "cancelled"],
      default: "scheduled",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Statistics
    views: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
flashSaleSchema.index({ startDate: 1, endDate: 1, status: 1 });
flashSaleSchema.index({ status: 1, isActive: 1 });

// Virtual for is active
flashSaleSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.status === "active" &&
    now >= this.startDate &&
    now <= this.endDate
  );
});

// Virtual for time remaining
flashSaleSchema.virtual("timeRemaining").get(function () {
  if (!this.isCurrentlyActive) return null;
  return this.endDate - new Date();
});

// Method to check if sale is active
flashSaleSchema.methods.checkStatus = function () {
  const now = new Date();

  if (now < this.startDate) {
    this.status = "scheduled";
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = "active";
  } else if (now > this.endDate) {
    this.status = "ended";
  }

  return this.status;
};

// Method to add product to sale
flashSaleSchema.methods.addProduct = function (productId, discount, originalPrice, stock) {
  const salePrice = originalPrice - (originalPrice * discount) / 100;

  const existingProduct = this.products.find(
    (p) => p.product.toString() === productId.toString()
  );

  if (existingProduct) {
    existingProduct.discount = discount;
    existingProduct.originalPrice = originalPrice;
    existingProduct.salePrice = salePrice;
    existingProduct.stock = stock;
  } else {
    this.products.push({
      product: productId,
      discount,
      originalPrice,
      salePrice,
      stock,
    });
  }

  return this.save();
};

// Method to remove product from sale
flashSaleSchema.methods.removeProduct = function (productId) {
  this.products = this.products.filter(
    (p) => p.product.toString() !== productId.toString()
  );
  return this.save();
};

// Static method to get active flash sales
flashSaleSchema.statics.getActive = async function () {
  const now = new Date();
  return await this.find({
    isActive: true,
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate("products.product");
};

flashSaleSchema.pre("save", function () {
  this.checkStatus();
});

const FlashSale = mongoose.model("FlashSale", flashSaleSchema);
export default FlashSale;


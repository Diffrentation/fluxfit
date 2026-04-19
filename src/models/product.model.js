import mongoose from "mongoose";
import "./category.model.js";
import "./brand.model.js";

const productVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
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
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      maxlength: 200,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    variants: [productVariantSchema],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    sizes: [
      {
        type: String,
        trim: true,
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    shipping: {
      type: String,
      default:
        "Free shipping on orders over ₹4150. Standard delivery: 3-5 business days.",
    },
    returnPolicy: {
      type: String,
      default:
        "30-day return policy. Items must be unworn and in original condition.",
    },
    // SEO Fields
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      trim: true,
    },
    metaKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "active", "inactive"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNew: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
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
    suppressReservedKeysWarning: true,
  }
);

// Indexes for better query performance
productSchema.index({ category: 1, status: 1, isDeleted: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ basePrice: 1, status: 1 });
productSchema.index({ "rating.average": -1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });
productSchema.index({ tags: 1, status: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" }); // Text search

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.basePrice) {
    return Math.round(
      ((this.originalPrice - this.basePrice) / this.originalPrice) * 100
    );
  }
  return this.discount || 0;
});

// Method to get variant by size and color
productSchema.methods.getVariant = function (size, color) {
  return this.variants.find(
    (v) => v.size === size && v.color === color && v.isActive
  );
};

// Method to check if product is available
productSchema.methods.isAvailable = function (size = null, color = null) {
  if (!this.inStock || this.isDeleted || this.status !== "active") {
    return false;
  }

  if (size && color) {
    const variant = this.getVariant(size, color);
    return variant && variant.stock > 0;
  }

  return this.stock > 0 || this.variants.some((v) => v.stock > 0 && v.isActive);
};

// Method to reduce stock
productSchema.methods.reduceStock = function (size, color, quantity) {
  if (size && color) {
    const variant = this.getVariant(size, color);
    if (variant && variant.stock >= quantity) {
      variant.stock -= quantity;
      if (variant.stock === 0) {
        variant.isActive = false;
      }
      // Update main stock
      this.stock = this.variants.reduce((sum, v) => sum + v.stock, 0);
      if (this.stock === 0) {
        this.inStock = false;
      }
      return true;
    }
    return false;
  } else {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      if (this.stock === 0) {
        this.inStock = false;
      }
      return true;
    }
    return false;
  }
};

// Method to increase stock
productSchema.methods.increaseStock = function (size, color, quantity) {
  if (size && color) {
    const variant = this.getVariant(size, color);
    if (variant) {
      variant.stock += quantity;
      variant.isActive = true;
    } else {
      // Create new variant
      this.variants.push({
        size,
        color,
        price: this.basePrice,
        stock: quantity,
        isActive: true,
      });
    }
    // Update main stock
    this.stock = this.variants.reduce((sum, v) => sum + v.stock, 0);
    this.inStock = true;
  } else {
    this.stock += quantity;
    this.inStock = true;
  }
};

// Static method to search products
productSchema.statics.search = async function (query, filters = {}) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    color,
    size,
    tags,
    inStock,
    status = "active",
    page = 1,
    limit = 20,
    sort = "-createdAt",
  } = filters;

  const searchQuery = {
    isDeleted: false,
    status,
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Filters
  if (category) searchQuery.category = category;
  if (brand) searchQuery.brand = brand;
  if (minPrice || maxPrice) {
    searchQuery.basePrice = {};
    if (minPrice) searchQuery.basePrice.$gte = minPrice;
    if (maxPrice) searchQuery.basePrice.$lte = maxPrice;
  }
  if (color) searchQuery.colors = color;
  if (size) searchQuery.sizes = size;
  if (tags && tags.length > 0) searchQuery.tags = { $in: tags };
  if (inStock !== undefined) searchQuery.inStock = inStock;

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.find(searchQuery)
      .populate("category", "name slug")
      .populate("brand", "name logo")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(searchQuery),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Pre-save: fill slug only when missing (never replace slug because name changed)
productSchema.pre("save", function () {
  if (this.slug && String(this.slug).trim()) return;
  const n = this.name && String(this.name).trim();
  if (n) {
    this.slug = n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;

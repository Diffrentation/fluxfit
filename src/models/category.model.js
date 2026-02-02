import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
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
categorySchema.index({ parent: 1, isActive: 1, isDeleted: 1 });
categorySchema.index({ sortOrder: 1, isActive: 1 });

// Virtual for children
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// Virtual for product count
categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Method to get all descendants (recursive)
categorySchema.methods.getDescendants = async function () {
  const descendants = [];
  const children = await mongoose.model("Category").find({ parent: this._id });

  for (const child of children) {
    descendants.push(child._id);
    const childDescendants = await child.getDescendants();
    descendants.push(...childDescendants);
  }

  return descendants;
};

// Method to get full path (breadcrumb)
categorySchema.methods.getPath = async function () {
  const path = [this];
  let current = this;

  while (current.parent) {
    current = await mongoose.model("Category").findById(current.parent);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }

  return path;
};

// Static method to get category tree
categorySchema.statics.getTree = async function (parentId = null) {
  const categories = await this.find({
    parent: parentId,
    isDeleted: false,
    isActive: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const tree = await Promise.all(
    categories.map(async (category) => {
      const children = await this.getTree(category._id);
      return {
        ...category,
        children,
      };
    })
  );

  return tree;
};

// Static method to get flat list with hierarchy
categorySchema.statics.getFlatList = async function () {
  const categories = await this.find({ isDeleted: false })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const buildTree = (parentId = null, level = 0) => {
    return categories
      .filter((cat) => {
        if (parentId === null) return !cat.parent;
        return cat.parent && cat.parent.toString() === parentId.toString();
      })
      .map((cat) => ({
        ...cat,
        level,
        children: buildTree(cat._id, level + 1),
      }));
  };

  return buildTree();
};

// Pre-save middleware to generate slug
categorySchema.pre("save", async function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;

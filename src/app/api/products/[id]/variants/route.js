import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/products/:id/variants
 * Get product variants
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get product ID from params
    const { id } = params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
          errors: [
            {
              field: "id",
              message: "Product ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find product
    const product = await Product.findOne(query).lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const inStock = searchParams.get("inStock");

    // Get variants
    let variants = product.variants || [];

    // Filter variants
    if (!includeInactive) {
      variants = variants.filter((v) => v.isActive !== false);
    }

    if (size) {
      variants = variants.filter((v) => v.size === size);
    }

    if (color) {
      variants = variants.filter((v) => v.color === color);
    }

    if (inStock === "true") {
      variants = variants.filter((v) => v.stock > 0);
    } else if (inStock === "false") {
      variants = variants.filter((v) => v.stock === 0);
    }

    // Format variants for response
    const formattedVariants = variants.map((variant) => ({
      id: variant._id,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      originalPrice: variant.originalPrice || null,
      sku: variant.sku || null,
      stock: variant.stock,
      image: variant.image || null,
      isActive: variant.isActive !== false,
      discount:
        variant.originalPrice && variant.originalPrice > variant.price
          ? Math.round(
              ((variant.originalPrice - variant.price) /
                variant.originalPrice) *
                100
            )
          : 0,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Product variants retrieved successfully",
        data: {
          productId: product._id,
          productName: product.name,
          variants: formattedVariants,
          count: formattedVariants.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product variants error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to retrieve product variants. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/:id/variants
 * Add product variant (Admin only)
 */
export async function POST(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get product ID from params
    const { id } = params;

    // Validate ID format
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
          errors: [
            {
              field: "id",
              message: "Product ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isDeleted: false };
    } else {
      query = { slug: id, isDeleted: false };
    }

    // Find product
    const product = await Product.findOne(query);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { size, color, price, originalPrice, sku, stock, image, isActive } =
      body;

    // Validate required fields
    const errors = [];

    if (!size || !size.trim()) {
      errors.push({
        field: "size",
        message: "Size is required",
      });
    }

    if (!color || !color.trim()) {
      errors.push({
        field: "color",
        message: "Color is required",
      });
    }

    if (price === undefined || price === null) {
      errors.push({
        field: "price",
        message: "Price is required",
      });
    } else if (price < 0) {
      errors.push({
        field: "price",
        message: "Price must be greater than or equal to 0",
      });
    }

    if (stock === undefined || stock === null) {
      errors.push({
        field: "stock",
        message: "Stock is required",
      });
    } else if (stock < 0) {
      errors.push({
        field: "stock",
        message: "Stock must be greater than or equal to 0",
      });
    }

    if (
      originalPrice !== undefined &&
      originalPrice !== null &&
      originalPrice < 0
    ) {
      errors.push({
        field: "originalPrice",
        message: "Original price must be greater than or equal to 0",
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Check if variant with same size and color already exists
    const existingVariant = product.variants.find(
      (v) =>
        v.size.trim().toLowerCase() === size.trim().toLowerCase() &&
        v.color.trim().toLowerCase() === color.trim().toLowerCase()
    );

    if (existingVariant) {
      return NextResponse.json(
        {
          success: false,
          message: "Variant with this size and color already exists",
          errors: [
            {
              field: "variant",
              message: `A variant with size "${size}" and color "${color}" already exists for this product`,
            },
          ],
        },
        { status: 409 }
      );
    }

    // Create new variant
    const newVariant = {
      size: size.trim(),
      color: color.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      isActive:
        isActive !== undefined
          ? isActive === true || isActive === "true"
          : true,
    };

    // Add optional fields
    if (originalPrice !== undefined && originalPrice !== null) {
      newVariant.originalPrice = parseFloat(originalPrice);
    }
    if (sku) {
      newVariant.sku = sku.trim().toUpperCase();
    }
    if (image) {
      newVariant.image = image.trim();
    }

    // Add variant to product
    product.variants.push(newVariant);

    // Recalculate product stock
    const totalStock = product.variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
    product.stock = totalStock;
    product.inStock = totalStock > 0;

    // Update colors and sizes arrays if not already present
    if (!product.colors.includes(newVariant.color)) {
      product.colors.push(newVariant.color);
    }
    if (!product.sizes.includes(newVariant.size)) {
      product.sizes.push(newVariant.size);
    }

    // Save product
    await product.save();

    // Get the newly created variant (last one in array)
    const createdVariant = product.variants[product.variants.length - 1];

    // Format response
    const discount =
      createdVariant.originalPrice &&
      createdVariant.originalPrice > createdVariant.price
        ? Math.round(
            ((createdVariant.originalPrice - createdVariant.price) /
              createdVariant.originalPrice) *
              100
          )
        : 0;

    return NextResponse.json(
      {
        success: true,
        message: "Product variant added successfully",
        data: {
          variant: {
            id: createdVariant._id,
            size: createdVariant.size,
            color: createdVariant.color,
            price: createdVariant.price,
            originalPrice: createdVariant.originalPrice || null,
            sku: createdVariant.sku || null,
            stock: createdVariant.stock,
            image: createdVariant.image || null,
            isActive: createdVariant.isActive,
            discount,
          },
          product: {
            id: product._id,
            name: product.name,
            stock: product.stock,
            inStock: product.inStock,
            colors: product.colors,
            sizes: product.sizes,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product variant error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to add product variant. Please try again.",
      },
      { status: 500 }
    );
  }
}

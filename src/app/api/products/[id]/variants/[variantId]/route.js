import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * PUT /api/products/:id/variants/:variantId
 * Update product variant (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get product ID and variant ID from params
    const { id, variantId } = params;

    // Validate IDs
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

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Variant ID is required",
          errors: [
            {
              field: "variantId",
              message: "Variant ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate variant ID format
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid variant ID format",
          errors: [
            {
              field: "variantId",
              message: "Variant ID must be a valid ObjectId",
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

    // Find variant
    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === variantId
    );

    if (variantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Variant not found",
        },
        { status: 404 }
      );
    }

    const variant = product.variants[variantIndex];

    // Parse request body
    const body = await request.json();
    const { size, color, price, originalPrice, sku, stock, image, isActive } =
      body;

    // Build update object with only provided fields
    const updateData = {};
    const errors = [];

    // Size
    if (size !== undefined) {
      if (!size || !size.trim()) {
        errors.push({
          field: "size",
          message: "Size cannot be empty",
        });
      } else {
        updateData.size = size.trim();
      }
    }

    // Color
    if (color !== undefined) {
      if (!color || !color.trim()) {
        errors.push({
          field: "color",
          message: "Color cannot be empty",
        });
      } else {
        updateData.color = color.trim();
      }
    }

    // Price
    if (price !== undefined) {
      if (price === null || price < 0) {
        errors.push({
          field: "price",
          message: "Price must be greater than or equal to 0",
        });
      } else {
        updateData.price = parseFloat(price);
      }
    }

    // Original price
    if (originalPrice !== undefined) {
      if (originalPrice !== null && originalPrice < 0) {
        errors.push({
          field: "originalPrice",
          message: "Original price must be greater than or equal to 0",
        });
      } else {
        updateData.originalPrice = originalPrice
          ? parseFloat(originalPrice)
          : null;
      }
    }

    // SKU
    if (sku !== undefined) {
      updateData.sku = sku ? sku.trim().toUpperCase() : null;
    }

    // Stock
    if (stock !== undefined) {
      if (stock < 0) {
        errors.push({
          field: "stock",
          message: "Stock must be greater than or equal to 0",
        });
      } else {
        updateData.stock = parseInt(stock);
      }
    }

    // Image
    if (image !== undefined) {
      updateData.image = image ? image.trim() : null;
    }

    // Is active
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === "true";
    }

    // Check if updating size/color would create a duplicate
    if (updateData.size || updateData.color) {
      const newSize = updateData.size || variant.size;
      const newColor = updateData.color || variant.color;

      const duplicateVariant = product.variants.find(
        (v, index) =>
          index !== variantIndex &&
          v.size.trim().toLowerCase() === newSize.trim().toLowerCase() &&
          v.color.trim().toLowerCase() === newColor.trim().toLowerCase()
      );

      if (duplicateVariant) {
        errors.push({
          field: "variant",
          message: `A variant with size "${newSize}" and color "${newColor}" already exists for this product`,
        });
      }
    }

    // Return validation errors if any
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

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided to update",
          errors: [
            {
              field: "body",
              message: "Please provide at least one field to update",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update variant
    Object.assign(variant, updateData);

    // Recalculate product stock
    const totalStock = product.variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
    product.stock = totalStock;
    product.inStock = totalStock > 0;

    // Update colors and sizes arrays if size or color changed
    if (updateData.size) {
      const allSizes = product.variants.map((v) => v.size);
      product.sizes = [...new Set(allSizes)];
    }
    if (updateData.color) {
      const allColors = product.variants.map((v) => v.color);
      product.colors = [...new Set(allColors)];
    }

    // Save product
    await product.save();

    // Format response
    const discount =
      variant.originalPrice && variant.originalPrice > variant.price
        ? Math.round(
            ((variant.originalPrice - variant.price) / variant.originalPrice) *
              100
          )
        : 0;

    return NextResponse.json(
      {
        success: true,
        message: "Product variant updated successfully",
        data: {
          variant: {
            id: variant._id,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            originalPrice: variant.originalPrice || null,
            sku: variant.sku || null,
            stock: variant.stock,
            image: variant.image || null,
            isActive: variant.isActive,
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
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product variant error:", error);

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
          error.message ||
          "Failed to update product variant. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id/variants/:variantId
 * Delete product variant (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get product ID and variant ID from params
    const { id, variantId } = params;

    // Validate IDs
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

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Variant ID is required",
          errors: [
            {
              field: "variantId",
              message: "Variant ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate variant ID format
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid variant ID format",
          errors: [
            {
              field: "variantId",
              message: "Variant ID must be a valid ObjectId",
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

    // Find variant
    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === variantId
    );

    if (variantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Variant not found",
        },
        { status: 404 }
      );
    }

    const variant = product.variants[variantIndex];

    // Check if this is the only variant
    if (product.variants.length === 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete the last variant. Product must have at least one variant.",
          errors: [
            {
              field: "variant",
              message: "Product must have at least one variant",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Remove variant from array
    product.variants.splice(variantIndex, 1);

    // Recalculate product stock
    const totalStock = product.variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
    product.stock = totalStock;
    product.inStock = totalStock > 0;

    // Update colors and sizes arrays
    const allSizes = product.variants.map((v) => v.size);
    const allColors = product.variants.map((v) => v.color);
    product.sizes = [...new Set(allSizes)];
    product.colors = [...new Set(allColors)];

    // Save product
    await product.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Product variant deleted successfully",
        data: {
          message: "Variant has been deleted successfully",
          variantId: variantId,
          product: {
            id: product._id,
            name: product.name,
            stock: product.stock,
            inStock: product.inStock,
            colors: product.colors,
            sizes: product.sizes,
            variantCount: product.variants.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product variant error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to delete product variant. Please try again.",
      },
      { status: 500 }
    );
  }
}

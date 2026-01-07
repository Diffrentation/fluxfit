import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * GET /api/products/:id/stock
 * Get product stock information
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

    // Calculate stock from variants if variants exist
    let totalStock = product.stock || 0;
    let variantStock = 0;
    const variantStockDetails = [];

    if (product.variants && product.variants.length > 0) {
      variantStock = product.variants.reduce((sum, v) => {
        const stock = v.stock || 0;
        if (v.isActive !== false) {
          variantStockDetails.push({
            id: v._id,
            size: v.size,
            color: v.color,
            stock: stock,
            sku: v.sku || null,
          });
        }
        return sum + stock;
      }, 0);

      // If variants exist, use variant stock total
      if (variantStock > 0) {
        totalStock = variantStock;
      }
    }

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Product stock retrieved successfully",
        data: {
          productId: product._id,
          productName: product.name,
          stock: totalStock,
          inStock: product.inStock,
          hasVariants: product.variants && product.variants.length > 0,
          variantCount: product.variants ? product.variants.length : 0,
          variants: variantStockDetails.length > 0 ? variantStockDetails : null,
          stockBreakdown: {
            mainStock: product.stock || 0,
            variantStock: variantStock,
            totalStock: totalStock,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product stock error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to retrieve product stock. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/:id/stock
 * Update product stock (Admin only)
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
    const { stock, inStock } = body;

    // Validate stock
    if (stock === undefined && inStock === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Stock or inStock field is required",
          errors: [
            {
              field: "body",
              message:
                "Please provide at least one field to update (stock or inStock)",
            },
          ],
        },
        { status: 400 }
      );
    }

    const errors = [];

    if (stock !== undefined) {
      if (stock === null || isNaN(stock) || stock < 0) {
        errors.push({
          field: "stock",
          message: "Stock must be a number greater than or equal to 0",
        });
      }
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

    // Update stock
    if (stock !== undefined) {
      product.stock = parseInt(stock);

      // If product has variants, recalculate total stock from variants
      if (product.variants && product.variants.length > 0) {
        const variantStockTotal = product.variants.reduce(
          (sum, v) => sum + (v.stock || 0),
          0
        );
        // Update main stock to match variant total
        product.stock = variantStockTotal;
      }

      // Update inStock status based on stock
      product.inStock = product.stock > 0;
    }

    // Update inStock if explicitly provided
    if (inStock !== undefined) {
      product.inStock = inStock === true || inStock === "true";
    }

    // Save product
    await product.save();

    // Calculate variant stock for response
    let variantStock = 0;
    const variantStockDetails = [];

    if (product.variants && product.variants.length > 0) {
      variantStock = product.variants.reduce((sum, v) => {
        const stock = v.stock || 0;
        if (v.isActive !== false) {
          variantStockDetails.push({
            id: v._id,
            size: v.size,
            color: v.color,
            stock: stock,
            sku: v.sku || null,
          });
        }
        return sum + stock;
      }, 0);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Product stock updated successfully",
        data: {
          productId: product._id,
          productName: product.name,
          stock: product.stock,
          inStock: product.inStock,
          hasVariants: product.variants && product.variants.length > 0,
          variantCount: product.variants ? product.variants.length : 0,
          variants: variantStockDetails.length > 0 ? variantStockDetails : null,
          stockBreakdown: {
            mainStock: product.stock,
            variantStock: variantStock,
            totalStock:
              product.variants && product.variants.length > 0
                ? variantStock
                : product.stock,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product stock error:", error);

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
          error.message || "Failed to update product stock. Please try again.",
      },
      { status: 500 }
    );
  }
}

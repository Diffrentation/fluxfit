import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import mongoose from "mongoose";

/**
 * POST /api/products/:id/stock/adjust
 * Adjust product stock (Admin only)
 * 
 * This endpoint allows adding or subtracting from current stock
 * Can adjust main product stock or a specific variant stock
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
    const { id } = await params;

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
    const { adjustment, variantId, reason } = body;

    // Validate adjustment
    if (adjustment === undefined || adjustment === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Adjustment value is required",
          errors: [
            {
              field: "adjustment",
              message: "Adjustment value is required (can be positive or negative)",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (isNaN(adjustment) || !Number.isInteger(Number(adjustment))) {
      return NextResponse.json(
        {
          success: false,
          message: "Adjustment must be a whole number",
          errors: [
            {
              field: "adjustment",
              message: "Adjustment must be a valid integer (stock cannot be fractional)",
            },
          ],
        },
        { status: 400 }
      );
    }

    const adjustmentValue = Number(adjustment);

    // Validate variant ID if provided
    if (variantId && !mongoose.Types.ObjectId.isValid(variantId)) {
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

    // Track previous stock for response
    const previousStock = product.stock;
    let previousVariantStock = null;
    let adjustedVariant = null;

    // Adjust variant stock if variantId is provided
    if (variantId) {
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

      adjustedVariant = product.variants[variantIndex];
      previousVariantStock = adjustedVariant.stock || 0;

      // Calculate new stock
      const newStock = previousVariantStock + adjustmentValue;

      // Prevent negative stock
      if (newStock < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Insufficient stock. Cannot adjust below 0",
            errors: [
              {
                field: "adjustment",
                message: `Current variant stock is ${previousVariantStock}. Cannot subtract ${Math.abs(adjustmentValue)}.`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // Update variant stock
      adjustedVariant.stock = newStock;
      adjustedVariant.isActive = newStock > 0;

      // Recalculate product total stock from all variants
      const totalStock = product.variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );
      product.stock = totalStock;
      product.inStock = totalStock > 0;
    } else if (product.variants && product.variants.length > 0) {
      // Total stock is derived from variant stocks (see Product pre-save
      // hook), so adjusting it directly here would be silently overwritten
      // on the very next save — the caller must target a specific variant.
      return NextResponse.json(
        {
          success: false,
          message: "This product has variants — specify a variantId to adjust stock",
          errors: [
            {
              field: "variantId",
              message:
                "Product total stock is computed from variant stock and cannot be adjusted directly. Provide variantId to adjust a specific variant.",
            },
          ],
        },
        { status: 400 }
      );
    } else {
      // Adjust main product stock
      const newStock = previousStock + adjustmentValue;

      // Prevent negative stock
      if (newStock < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Insufficient stock. Cannot adjust below 0",
            errors: [
              {
                field: "adjustment",
                message: `Current stock is ${previousStock}. Cannot subtract ${Math.abs(adjustmentValue)}.`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // Update product stock
      product.stock = newStock;
      product.inStock = newStock > 0;

      // If product has variants, also update variant stock proportionally or keep variant stock separate
      // For now, we'll keep variants separate and just update main stock
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

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Stock adjusted successfully",
        data: {
          productId: product._id,
          productName: product.name,
          adjustment: adjustmentValue,
          reason: reason || null,
          previousStock: previousStock,
          newStock: product.stock,
          inStock: product.inStock,
          adjustedVariant: adjustedVariant
            ? {
                id: adjustedVariant._id,
                size: adjustedVariant.size,
                color: adjustedVariant.color,
                previousStock: previousVariantStock,
                newStock: adjustedVariant.stock,
                sku: adjustedVariant.sku || null,
              }
            : null,
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
    console.error("Adjust product stock error:", error);

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
          error.message || "Failed to adjust product stock. Please try again.",
      },
      { status: 500 }
    );
  }
}


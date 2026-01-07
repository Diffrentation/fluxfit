import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TaxRate from "@/models/taxrate.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/settings/tax-rates/:id
 * Update tax rate
 * 
 * Body Parameters (all optional):
 * - name: Tax rate name
 * - code: Tax rate code (unique, will be converted to uppercase)
 * - rate: Tax rate percentage (0-100)
 * - type: Tax type - "gst", "vat", "sales", "service"
 * - description: Description
 * - applicableTo: Applicability - "all", "categories", "products"
 * - categories: Array of category IDs (required if applicableTo is "categories")
 * - products: Array of product IDs (required if applicableTo is "products")
 * - states: Array of state names
 * - isActive: Active status
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get tax rate ID
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tax rate ID",
          errors: [{ field: "id", message: "Valid tax rate ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get tax rate
    const taxRate = await TaxRate.findById(id);
    if (!taxRate) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate not found",
        },
        { status: 404 }
      );
    }

    // Get body
    const body = await request.json();
    const {
      name,
      code,
      rate,
      type,
      description,
      applicableTo,
      categories,
      products,
      states,
      isActive,
    } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Tax rate name cannot be empty",
            errors: [{ field: "name", message: "Tax rate name is required" }],
          },
          { status: 400 }
        );
      }
      taxRate.name = name.trim();
    }

    // Validate code if provided
    if (code !== undefined) {
      if (!code || !code.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Tax rate code cannot be empty",
            errors: [{ field: "code", message: "Tax rate code is required" }],
          },
          { status: 400 }
        );
      }

      const codeUpper = code.trim().toUpperCase();
      // Check if code already exists (excluding current tax rate)
      if (codeUpper !== taxRate.code) {
        const existingTaxRate = await TaxRate.findOne({
          code: codeUpper,
          _id: { $ne: id },
        });

        if (existingTaxRate) {
          return NextResponse.json(
            {
              success: false,
              message: "Tax rate code already exists",
              errors: [
                {
                  field: "code",
                  message: `Tax rate with code "${codeUpper}" already exists`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
      taxRate.code = codeUpper;
    }

    // Validate rate if provided
    if (rate !== undefined) {
      const rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Tax rate must be a number between 0 and 100",
            errors: [
              {
                field: "rate",
                message: "Tax rate must be a number between 0 and 100",
              },
            ],
          },
          { status: 400 }
        );
      }
      taxRate.rate = rateNum;
    }

    // Validate type if provided
    if (type !== undefined) {
      const validTypes = ["gst", "vat", "sales", "service"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid tax type. Must be one of: ${validTypes.join(", ")}`,
            errors: [
              {
                field: "type",
                message: `Tax type must be one of: ${validTypes.join(", ")}`,
              },
            ],
          },
          { status: 400 }
        );
      }
      taxRate.type = type;
    }

    // Update description if provided
    if (description !== undefined) {
      taxRate.description = description ? description.trim() : null;
    }

    // Validate applicableTo if provided
    if (applicableTo !== undefined) {
      const validApplicableTo = ["all", "categories", "products"];
      if (!validApplicableTo.includes(applicableTo)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid applicableTo. Must be one of: ${validApplicableTo.join(", ")}`,
            errors: [
              {
                field: "applicableTo",
                message: `ApplicableTo must be one of: ${validApplicableTo.join(", ")}`,
              },
            ],
          },
          { status: 400 }
        );
      }

      const newApplicableTo = applicableTo;
      const currentApplicableTo = taxRate.applicableTo;

      // If changing applicability, validate required fields
      if (newApplicableTo === "categories") {
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
          // If changing from non-categories to categories, require categories
          if (currentApplicableTo !== "categories") {
            return NextResponse.json(
              {
                success: false,
                message: "Categories are required when applicableTo is 'categories'",
                errors: [
                  {
                    field: "categories",
                    message: "At least one category is required",
                  },
                ],
              },
              { status: 400 }
            );
          }
        } else {
          // Validate category IDs
          for (const catId of categories) {
            if (!mongoose.Types.ObjectId.isValid(catId)) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Invalid category ID: ${catId}`,
                  errors: [
                    {
                      field: "categories",
                      message: "All category IDs must be valid ObjectIds",
                    },
                  ],
                },
                { status: 400 }
              );
            }
          }
          taxRate.categories = categories;
        }
      } else if (newApplicableTo === "products") {
        if (!products || !Array.isArray(products) || products.length === 0) {
          // If changing from non-products to products, require products
          if (currentApplicableTo !== "products") {
            return NextResponse.json(
              {
                success: false,
                message: "Products are required when applicableTo is 'products'",
                errors: [
                  {
                    field: "products",
                    message: "At least one product is required",
                  },
                ],
              },
              { status: 400 }
            );
          }
        } else {
          // Validate product IDs
          for (const prodId of products) {
            if (!mongoose.Types.ObjectId.isValid(prodId)) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Invalid product ID: ${prodId}`,
                  errors: [
                    {
                      field: "products",
                      message: "All product IDs must be valid ObjectIds",
                    },
                  ],
                },
                { status: 400 }
              );
            }
          }
          taxRate.products = products;
        }
      }

      taxRate.applicableTo = newApplicableTo;

      // Clear categories/products if changing to "all"
      if (newApplicableTo === "all") {
        taxRate.categories = [];
        taxRate.products = [];
      }
    }

    // Update categories if provided (and applicableTo allows it)
    if (categories !== undefined && taxRate.applicableTo === "categories") {
      if (!Array.isArray(categories) || categories.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "At least one category is required when applicableTo is 'categories'",
            errors: [
              {
                field: "categories",
                message: "At least one category is required",
              },
            ],
          },
          { status: 400 }
        );
      }

      // Validate category IDs
      for (const catId of categories) {
        if (!mongoose.Types.ObjectId.isValid(catId)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid category ID: ${catId}`,
              errors: [
                {
                  field: "categories",
                  message: "All category IDs must be valid ObjectIds",
                },
              ],
            },
            { status: 400 }
          );
        }
      }
      taxRate.categories = categories;
    }

    // Update products if provided (and applicableTo allows it)
    if (products !== undefined && taxRate.applicableTo === "products") {
      if (!Array.isArray(products) || products.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "At least one product is required when applicableTo is 'products'",
            errors: [
              {
                field: "products",
                message: "At least one product is required",
              },
            ],
          },
          { status: 400 }
        );
      }

      // Validate product IDs
      for (const prodId of products) {
        if (!mongoose.Types.ObjectId.isValid(prodId)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid product ID: ${prodId}`,
              errors: [
                {
                  field: "products",
                  message: "All product IDs must be valid ObjectIds",
                },
              ],
            },
            { status: 400 }
          );
        }
      }
      taxRate.products = products;
    }

    // Update states if provided
    if (states !== undefined) {
      if (Array.isArray(states)) {
        taxRate.states = states.map((s) => s.trim()).filter((s) => s.length > 0);
      } else {
        taxRate.states = [];
      }
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be a boolean",
            errors: [
              {
                field: "isActive",
                message: "isActive must be true or false",
              },
            ],
          },
          { status: 400 }
        );
      }
      taxRate.isActive = isActive;
    }

    // Save tax rate
    await taxRate.save();

    // Populate related fields
    await taxRate.populate("categories", "name slug");
    await taxRate.populate("products", "name slug");

    // Format tax rate
    const formattedTaxRate = {
      id: taxRate._id,
      name: taxRate.name,
      code: taxRate.code,
      rate: taxRate.rate,
      type: taxRate.type,
      description: taxRate.description || null,
      applicableTo: taxRate.applicableTo,
      categories: taxRate.categories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
      })),
      products: taxRate.products.map((prod) => ({
        id: prod._id,
        name: prod.name,
        slug: prod.slug,
      })),
      states: taxRate.states || [],
      isActive: taxRate.isActive,
      createdAt: taxRate.createdAt,
      updatedAt: taxRate.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Tax rate updated successfully",
        data: {
          taxRate: formattedTaxRate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update tax rate error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate code already exists",
          errors: [
            {
              field: "code",
              message: "A tax rate with this code already exists",
            },
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update tax rate. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/tax-rates/:id
 * Delete tax rate
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get tax rate ID
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tax rate ID",
          errors: [{ field: "id", message: "Valid tax rate ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get tax rate
    const taxRate = await TaxRate.findById(id);
    if (!taxRate) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate not found",
        },
        { status: 404 }
      );
    }

    // Store tax rate info before deletion
    const taxRateInfo = {
      id: taxRate._id,
      name: taxRate.name,
      code: taxRate.code,
      rate: taxRate.rate,
    };

    // Delete tax rate
    await TaxRate.findByIdAndDelete(id);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Tax rate deleted successfully",
        data: {
          deletedTaxRate: taxRateInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete tax rate error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete tax rate. Please try again.",
      },
      { status: 500 }
    );
  }
}


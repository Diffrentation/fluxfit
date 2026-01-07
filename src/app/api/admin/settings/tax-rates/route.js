import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TaxRate from "@/models/taxrate.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/settings/tax-rates
 * Get tax rates
 * 
 * Query Parameters:
 * - isActive: Filter by active status - "true", "false" (optional)
 * - type: Filter by tax type - "gst", "vat", "sales", "service" (optional)
 * - applicableTo: Filter by applicability - "all", "categories", "products" (optional)
 * - state: Filter by state (optional)
 * - sort: Sort order - "newest" (default), "oldest", "rate-asc", "rate-desc", "name-asc", "name-desc"
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const applicableTo = searchParams.get("applicableTo");
    const state = searchParams.get("state");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    if (type) {
      const validTypes = ["gst", "vat", "sales", "service"];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    if (applicableTo) {
      const validApplicableTo = ["all", "categories", "products"];
      if (validApplicableTo.includes(applicableTo)) {
        query.applicableTo = applicableTo;
      }
    }

    if (state) {
      query.states = { $in: [state] };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "rate-asc":
        sortObj.rate = 1;
        break;
      case "rate-desc":
        sortObj.rate = -1;
        break;
      case "name-asc":
        sortObj.name = 1;
        break;
      case "name-desc":
        sortObj.name = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Get tax rates
    const taxRates = await TaxRate.find(query)
      .populate("categories", "name slug")
      .populate("products", "name slug")
      .sort(sortObj)
      .lean();

    // Format tax rates
    const formattedTaxRates = taxRates.map((taxRate) => ({
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
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Tax rates retrieved successfully",
        data: {
          taxRates: formattedTaxRates,
          count: formattedTaxRates.length,
          filters: {
            isActive: isActive || null,
            type: type || null,
            applicableTo: applicableTo || null,
            state: state || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get tax rates error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve tax rates. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/tax-rates
 * Add tax rate
 * 
 * Body Parameters:
 * - name: Tax rate name (required)
 * - code: Tax rate code (required, unique, will be converted to uppercase)
 * - rate: Tax rate percentage (required, 0-100)
 * - type: Tax type - "gst", "vat", "sales", "service" (default: "gst")
 * - description: Description (optional)
 * - applicableTo: Applicability - "all", "categories", "products" (default: "all")
 * - categories: Array of category IDs (optional, required if applicableTo is "categories")
 * - products: Array of product IDs (optional, required if applicableTo is "products")
 * - states: Array of state names (optional)
 * - isActive: Active status (default: true)
 */
export async function POST(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate name is required",
          errors: [{ field: "name", message: "Tax rate name is required" }],
        },
        { status: 400 }
      );
    }

    if (!code || !code.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate code is required",
          errors: [{ field: "code", message: "Tax rate code is required" }],
        },
        { status: 400 }
      );
    }

    if (rate === undefined || rate === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate percentage is required",
          errors: [{ field: "rate", message: "Tax rate percentage is required" }],
        },
        { status: 400 }
      );
    }

    // Validate rate
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

    // Validate type
    const validTypes = ["gst", "vat", "sales", "service"];
    const taxType = type || "gst";
    if (!validTypes.includes(taxType)) {
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

    // Validate applicableTo
    const validApplicableTo = ["all", "categories", "products"];
    const applicable = applicableTo || "all";
    if (!validApplicableTo.includes(applicable)) {
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

    // Validate categories if applicableTo is "categories"
    if (applicable === "categories") {
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
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
    }

    // Validate products if applicableTo is "products"
    if (applicable === "products") {
      if (!products || !Array.isArray(products) || products.length === 0) {
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
    }

    // Check if code already exists
    const existingTaxRate = await TaxRate.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingTaxRate) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax rate code already exists",
          errors: [
            {
              field: "code",
              message: `Tax rate with code "${code.toUpperCase()}" already exists`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create tax rate
    const taxRateData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      rate: rateNum,
      type: taxType,
      description: description ? description.trim() : null,
      applicableTo: applicable,
      isActive: isActive !== undefined ? isActive : true,
    };

    if (categories && categories.length > 0) {
      taxRateData.categories = categories;
    }

    if (products && products.length > 0) {
      taxRateData.products = products;
    }

    if (states && Array.isArray(states) && states.length > 0) {
      taxRateData.states = states.map((s) => s.trim());
    }

    const taxRate = await TaxRate.create(taxRateData);

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
        message: "Tax rate created successfully",
        data: {
          taxRate: formattedTaxRate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create tax rate error:", error);

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
        message: error.message || "Failed to create tax rate. Please try again.",
      },
      { status: 500 }
    );
  }
}


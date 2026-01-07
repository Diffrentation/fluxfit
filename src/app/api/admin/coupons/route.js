import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/coupon.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/coupons
 * Get all coupons (Admin)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - isActive: Filter by active status (true/false)
 * - isDeleted: Filter by deleted status (true/false)
 * - valid: Filter by validity (true/false) - checks if coupon is currently valid
 * - type: Filter by coupon type (percentage/fixed)
 * - applicableTo: Filter by applicability (all/categories/products/brands)
 * - search: Search by code or name
 * - sort: Sort order - "newest" (default), "oldest", "discount-desc", "discount-asc", "usage-desc", "usage-asc"
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const isActive = searchParams.get("isActive");
    const isDeleted = searchParams.get("isDeleted");
    const valid = searchParams.get("valid");
    const type = searchParams.get("type");
    const applicableTo = searchParams.get("applicableTo");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    // Active status filter
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Deleted status filter
    if (isDeleted !== null && isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true";
    } else {
      // By default, show non-deleted coupons unless explicitly requested
      if (isDeleted === undefined) {
        query.isDeleted = false;
      }
    }

    // Type filter
    if (type) {
      const validTypes = ["percentage", "fixed"];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    // Applicable to filter
    if (applicableTo) {
      const validApplicableTo = ["all", "categories", "products", "brands"];
      if (validApplicableTo.includes(applicableTo)) {
        query.applicableTo = applicableTo;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "discount-asc":
        sortObj.discount = 1;
        break;
      case "discount-desc":
        sortObj.discount = -1;
        break;
      case "usage-asc":
        sortObj.usageCount = 1;
        break;
      case "usage-desc":
        sortObj.usageCount = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("categories", "name slug")
        .populate("products", "name slug")
        .populate("brands", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    // Current date for validity checks
    const now = new Date();

    // Format coupons for response
    const formattedCoupons = coupons.map((coupon) => {
      // Check if coupon is currently valid
      const isValid =
        coupon.isActive &&
        !coupon.isDeleted &&
        now >= new Date(coupon.validFrom) &&
        now <= new Date(coupon.validUntil) &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit);

      // Calculate remaining usage
      const remainingUsage = coupon.usageLimit
        ? Math.max(0, coupon.usageLimit - coupon.usageCount)
        : null;

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (new Date(coupon.validUntil) - now) / (1000 * 60 * 60 * 24)
      );

      // Calculate days since start
      const daysSinceStart = Math.ceil(
        (now - new Date(coupon.validFrom)) / (1000 * 60 * 60 * 24)
      );

      return {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || null,
        type: coupon.type,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount || null,
        minPurchase: coupon.minPurchase || 0,
        maxPurchase: coupon.maxPurchase || null,
        usageLimit: coupon.usageLimit || null,
        usageCount: coupon.usageCount || 0,
        remainingUsage: remainingUsage,
        usagePercentage: coupon.usageLimit
          ? Math.round((coupon.usageCount / coupon.usageLimit) * 100)
          : null,
        perUserLimit: coupon.perUserLimit || 1,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        daysRemaining: daysRemaining,
        daysSinceStart: daysSinceStart,
        applicableTo: coupon.applicableTo,
        categories: coupon.categories || [],
        products: coupon.products || [],
        brands: coupon.brands || [],
        isActive: coupon.isActive,
        isDeleted: coupon.isDeleted,
        deletedAt: coupon.deletedAt || null,
        isValid: isValid,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      };
    });

    // Filter by validity if requested (after formatting to check isValid)
    let filteredCoupons = formattedCoupons;
    if (valid !== null && valid !== undefined) {
      const isValidFilter = valid === "true";
      filteredCoupons = formattedCoupons.filter(
        (coupon) => coupon.isValid === isValidFilter
      );
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupons retrieved successfully",
        data: {
          coupons: filteredCoupons,
          pagination: {
            page,
            limit,
            total: valid !== null && valid !== undefined ? filteredCoupons.length : total,
            totalPages: Math.ceil(
              (valid !== null && valid !== undefined ? filteredCoupons.length : total) /
                limit
            ),
            hasNextPage:
              page <
              Math.ceil(
                (valid !== null && valid !== undefined
                  ? filteredCoupons.length
                  : total) / limit
              ),
            hasPrevPage: page > 1,
          },
          filters: {
            isActive: isActive || null,
            isDeleted: isDeleted || null,
            valid: valid || null,
            type: type || null,
            applicableTo: applicableTo || null,
            search: search || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin coupons error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve coupons. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create coupon (Admin)
 * 
 * Request Body:
 * - code: Coupon code (required, unique, uppercase)
 * - name: Coupon name (required)
 * - description: Coupon description (optional)
 * - type: Coupon type - "percentage" or "fixed" (required)
 * - discount: Discount value (required, min: 0)
 * - maxDiscount: Maximum discount amount (optional, for percentage type)
 * - minPurchase: Minimum purchase amount (optional, default: 0)
 * - maxPurchase: Maximum purchase amount (optional)
 * - usageLimit: Total usage limit (optional)
 * - perUserLimit: Per user usage limit (optional, default: 1)
 * - validFrom: Valid from date (required, ISO format)
 * - validUntil: Valid until date (required, ISO format)
 * - applicableTo: Applicability - "all", "categories", "products", "brands" (optional, default: "all")
 * - categories: Array of category IDs (optional)
 * - products: Array of product IDs (optional)
 * - brands: Array of brand IDs (optional)
 * - isActive: Active status (optional, default: true)
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

    // Parse request body
    const body = await request.json();
    const {
      code,
      name,
      description,
      type,
      discount,
      maxDiscount,
      minPurchase,
      maxPurchase,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
      applicableTo,
      categories,
      products,
      brands,
      isActive,
    } = body;

    // Validation errors
    const errors = [];

    // Validate required fields
    if (!code || !code.trim()) {
      errors.push({
        field: "code",
        message: "Coupon code is required",
      });
    }

    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Coupon name is required",
      });
    }

    if (!type) {
      errors.push({
        field: "type",
        message: "Coupon type is required",
      });
    } else if (!["percentage", "fixed"].includes(type)) {
      errors.push({
        field: "type",
        message: "Coupon type must be 'percentage' or 'fixed'",
      });
    }

    if (discount === undefined || discount === null) {
      errors.push({
        field: "discount",
        message: "Discount value is required",
      });
    } else if (typeof discount !== "number" || discount < 0) {
      errors.push({
        field: "discount",
        message: "Discount must be a non-negative number",
      });
    } else if (type === "percentage" && discount > 100) {
      errors.push({
        field: "discount",
        message: "Percentage discount cannot exceed 100",
      });
    }

    if (!validFrom) {
      errors.push({
        field: "validFrom",
        message: "Valid from date is required",
      });
    }

    if (!validUntil) {
      errors.push({
        field: "validUntil",
        message: "Valid until date is required",
      });
    }

    // Validate dates
    if (validFrom && validUntil) {
      const fromDate = new Date(validFrom);
      const untilDate = new Date(validUntil);

      if (isNaN(fromDate.getTime())) {
        errors.push({
          field: "validFrom",
          message: "Invalid valid from date format",
        });
      }

      if (isNaN(untilDate.getTime())) {
        errors.push({
          field: "validUntil",
          message: "Invalid valid until date format",
        });
      }

      if (
        !isNaN(fromDate.getTime()) &&
        !isNaN(untilDate.getTime()) &&
        fromDate >= untilDate
      ) {
        errors.push({
          field: "validUntil",
          message: "Valid until date must be after valid from date",
        });
      }
    }

    // Validate maxDiscount for percentage type
    if (type === "percentage" && maxDiscount !== undefined && maxDiscount !== null) {
      if (typeof maxDiscount !== "number" || maxDiscount < 0) {
        errors.push({
          field: "maxDiscount",
          message: "Maximum discount must be a non-negative number",
        });
      }
    }

    // Validate minPurchase
    if (minPurchase !== undefined && minPurchase !== null) {
      if (typeof minPurchase !== "number" || minPurchase < 0) {
        errors.push({
          field: "minPurchase",
          message: "Minimum purchase must be a non-negative number",
        });
      }
    }

    // Validate maxPurchase
    if (maxPurchase !== undefined && maxPurchase !== null) {
      if (typeof maxPurchase !== "number" || maxPurchase < 0) {
        errors.push({
          field: "maxPurchase",
          message: "Maximum purchase must be a non-negative number",
        });
      }
      if (
        minPurchase !== undefined &&
        minPurchase !== null &&
        maxPurchase <= minPurchase
      ) {
        errors.push({
          field: "maxPurchase",
          message: "Maximum purchase must be greater than minimum purchase",
        });
      }
    }

    // Validate usageLimit
    if (usageLimit !== undefined && usageLimit !== null) {
      if (typeof usageLimit !== "number" || usageLimit < 1) {
        errors.push({
          field: "usageLimit",
          message: "Usage limit must be a positive number",
        });
      }
    }

    // Validate perUserLimit
    if (perUserLimit !== undefined && perUserLimit !== null) {
      if (typeof perUserLimit !== "number" || perUserLimit < 1) {
        errors.push({
          field: "perUserLimit",
          message: "Per user limit must be a positive number",
        });
      }
    }

    // Validate applicableTo
    if (applicableTo && !["all", "categories", "products", "brands"].includes(applicableTo)) {
      errors.push({
        field: "applicableTo",
        message: "Applicable to must be 'all', 'categories', 'products', or 'brands'",
      });
    }

    // Validate categories, products, brands arrays
    if (categories && !Array.isArray(categories)) {
      errors.push({
        field: "categories",
        message: "Categories must be an array",
      });
    }

    if (products && !Array.isArray(products)) {
      errors.push({
        field: "products",
        message: "Products must be an array",
      });
    }

    if (brands && !Array.isArray(brands)) {
      errors.push({
        field: "brands",
        message: "Brands must be an array",
      });
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

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isDeleted: false,
    });

    if (existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code already exists",
          errors: [
            {
              field: "code",
              message: `Coupon with code "${code.trim().toUpperCase()}" already exists`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create coupon data
    const couponData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description ? description.trim() : null,
      type,
      discount,
      maxDiscount: maxDiscount || null,
      minPurchase: minPurchase || 0,
      maxPurchase: maxPurchase || null,
      usageLimit: usageLimit || null,
      usageCount: 0,
      perUserLimit: perUserLimit || 1,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      applicableTo: applicableTo || "all",
      categories: categories || [],
      products: products || [],
      brands: brands || [],
      isActive: isActive !== undefined ? isActive : true,
      isDeleted: false,
    };

    // Create coupon
    const newCoupon = new Coupon(couponData);
    await newCoupon.save();

    // Populate coupon for response
    await newCoupon.populate("categories", "name slug");
    await newCoupon.populate("products", "name slug");
    await newCoupon.populate("brands", "name slug");

    // Format coupon for response
    const formattedCoupon = {
      id: newCoupon._id,
      code: newCoupon.code,
      name: newCoupon.name,
      description: newCoupon.description || null,
      type: newCoupon.type,
      discount: newCoupon.discount,
      maxDiscount: newCoupon.maxDiscount || null,
      minPurchase: newCoupon.minPurchase || 0,
      maxPurchase: newCoupon.maxPurchase || null,
      usageLimit: newCoupon.usageLimit || null,
      usageCount: newCoupon.usageCount || 0,
      remainingUsage: newCoupon.usageLimit || null,
      perUserLimit: newCoupon.perUserLimit || 1,
      validFrom: newCoupon.validFrom,
      validUntil: newCoupon.validUntil,
      applicableTo: newCoupon.applicableTo,
      categories: newCoupon.categories || [],
      products: newCoupon.products || [],
      brands: newCoupon.brands || [],
      isActive: newCoupon.isActive,
      isDeleted: newCoupon.isDeleted,
      createdAt: newCoupon.createdAt,
      updatedAt: newCoupon.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon created successfully",
        data: {
          coupon: formattedCoupon,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create coupon error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code already exists",
          errors: [
            {
              field: "code",
              message: "A coupon with this code already exists",
            },
          ],
        },
        { status: 400 }
      );
    }

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
        message: error.message || "Failed to create coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}


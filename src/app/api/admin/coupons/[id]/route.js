import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/coupon.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/coupons/:id
 * Get coupon details (Admin)
 * Supports both ObjectId and coupon code
 */
export async function GET(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get coupon ID or code from params
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon ID or code is required",
          errors: [
            {
              field: "id",
              message: "Coupon ID or code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as coupon code
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    // Find coupon
    const coupon = await Coupon.findOne(query)
      .populate("categories", "name slug")
      .populate("products", "name slug images basePrice")
      .populate("brands", "name slug logo")
      .lean();

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Current date for validity checks
    const now = new Date();

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

    // Format coupon data
    const formattedCoupon = {
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

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon retrieved successfully",
        data: {
          coupon: formattedCoupon,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/coupons/:id
 * Update coupon (Admin)
 * Supports both ObjectId and coupon code
 * 
 * Request Body: (all fields optional except those being updated)
 * - name: Coupon name
 * - description: Coupon description
 * - type: Coupon type - "percentage" or "fixed"
 * - discount: Discount value
 * - maxDiscount: Maximum discount amount
 * - minPurchase: Minimum purchase amount
 * - maxPurchase: Maximum purchase amount
 * - usageLimit: Total usage limit
 * - perUserLimit: Per user usage limit
 * - validFrom: Valid from date (ISO format)
 * - validUntil: Valid until date (ISO format)
 * - applicableTo: Applicability - "all", "categories", "products", "brands"
 * - categories: Array of category IDs
 * - products: Array of product IDs
 * - brands: Array of brand IDs
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

    // Get coupon ID or code from params
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon ID or code is required",
          errors: [
            {
              field: "id",
              message: "Coupon ID or code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
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

    // Build query - try as ObjectId first, then as coupon code
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    // Find coupon
    const coupon = await Coupon.findOne(query);

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Validation errors
    const errors = [];
    const updateData = {};

    // Validate and update fields
    if (name !== undefined) {
      if (!name || !name.trim()) {
        errors.push({
          field: "name",
          message: "Coupon name cannot be empty",
        });
      } else {
        updateData.name = name.trim();
      }
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (type !== undefined) {
      if (!["percentage", "fixed"].includes(type)) {
        errors.push({
          field: "type",
          message: "Coupon type must be 'percentage' or 'fixed'",
        });
      } else {
        updateData.type = type;
      }
    }

    if (discount !== undefined) {
      if (typeof discount !== "number" || discount < 0) {
        errors.push({
          field: "discount",
          message: "Discount must be a non-negative number",
        });
      } else {
        const finalType = type !== undefined ? type : coupon.type;
        if (finalType === "percentage" && discount > 100) {
          errors.push({
            field: "discount",
            message: "Percentage discount cannot exceed 100",
          });
        } else {
          updateData.discount = discount;
        }
      }
    }

    if (maxDiscount !== undefined) {
      if (maxDiscount === null) {
        updateData.maxDiscount = null;
      } else if (typeof maxDiscount !== "number" || maxDiscount < 0) {
        errors.push({
          field: "maxDiscount",
          message: "Maximum discount must be a non-negative number or null",
        });
      } else {
        updateData.maxDiscount = maxDiscount;
      }
    }

    if (minPurchase !== undefined) {
      if (typeof minPurchase !== "number" || minPurchase < 0) {
        errors.push({
          field: "minPurchase",
          message: "Minimum purchase must be a non-negative number",
        });
      } else {
        updateData.minPurchase = minPurchase;
      }
    }

    if (maxPurchase !== undefined) {
      if (maxPurchase === null) {
        updateData.maxPurchase = null;
      } else if (typeof maxPurchase !== "number" || maxPurchase < 0) {
        errors.push({
          field: "maxPurchase",
          message: "Maximum purchase must be a non-negative number or null",
        });
      } else {
        const finalMinPurchase =
          minPurchase !== undefined ? minPurchase : coupon.minPurchase;
        if (maxPurchase <= finalMinPurchase) {
          errors.push({
            field: "maxPurchase",
            message: "Maximum purchase must be greater than minimum purchase",
          });
        } else {
          updateData.maxPurchase = maxPurchase;
        }
      }
    }

    if (usageLimit !== undefined) {
      if (usageLimit === null) {
        updateData.usageLimit = null;
      } else if (typeof usageLimit !== "number" || usageLimit < 1) {
        errors.push({
          field: "usageLimit",
          message: "Usage limit must be a positive number or null",
        });
      } else if (usageLimit < coupon.usageCount) {
        errors.push({
          field: "usageLimit",
          message: `Usage limit cannot be less than current usage count (${coupon.usageCount})`,
        });
      } else {
        updateData.usageLimit = usageLimit;
      }
    }

    if (perUserLimit !== undefined) {
      if (typeof perUserLimit !== "number" || perUserLimit < 1) {
        errors.push({
          field: "perUserLimit",
          message: "Per user limit must be a positive number",
        });
      } else {
        updateData.perUserLimit = perUserLimit;
      }
    }

    if (validFrom !== undefined) {
      const fromDate = new Date(validFrom);
      if (isNaN(fromDate.getTime())) {
        errors.push({
          field: "validFrom",
          message: "Invalid valid from date format",
        });
      } else {
        updateData.validFrom = fromDate;
      }
    }

    if (validUntil !== undefined) {
      const untilDate = new Date(validUntil);
      if (isNaN(untilDate.getTime())) {
        errors.push({
          field: "validUntil",
          message: "Invalid valid until date format",
        });
      } else {
        updateData.validUntil = untilDate;
      }
    }

    // Validate date range
    const finalValidFrom = validFrom !== undefined ? new Date(validFrom) : coupon.validFrom;
    const finalValidUntil = validUntil !== undefined ? new Date(validUntil) : coupon.validUntil;
    if (
      !isNaN(finalValidFrom.getTime()) &&
      !isNaN(finalValidUntil.getTime()) &&
      finalValidFrom >= finalValidUntil
    ) {
      errors.push({
        field: "validUntil",
        message: "Valid until date must be after valid from date",
      });
    }

    if (applicableTo !== undefined) {
      if (!["all", "categories", "products", "brands"].includes(applicableTo)) {
        errors.push({
          field: "applicableTo",
          message: "Applicable to must be 'all', 'categories', 'products', or 'brands'",
        });
      } else {
        updateData.applicableTo = applicableTo;
      }
    }

    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        errors.push({
          field: "categories",
          message: "Categories must be an array",
        });
      } else {
        updateData.categories = categories;
      }
    }

    if (products !== undefined) {
      if (!Array.isArray(products)) {
        errors.push({
          field: "products",
          message: "Products must be an array",
        });
      } else {
        updateData.products = products;
      }
    }

    if (brands !== undefined) {
      if (!Array.isArray(brands)) {
        errors.push({
          field: "brands",
          message: "Brands must be an array",
        });
      } else {
        updateData.brands = brands;
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        errors.push({
          field: "isActive",
          message: "Active status must be a boolean",
        });
      } else {
        updateData.isActive = isActive;
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

    // Update coupon
    Object.assign(coupon, updateData);
    await coupon.save();

    // Populate coupon for response
    await coupon.populate("categories", "name slug");
    await coupon.populate("products", "name slug");
    await coupon.populate("brands", "name slug");

    // Current date for validity checks
    const now = new Date();

    // Check if coupon is currently valid
    const isValid =
      coupon.isActive &&
      !coupon.isDeleted &&
      now >= coupon.validFrom &&
      now <= coupon.validUntil &&
      (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit);

    // Calculate remaining usage
    const remainingUsage = coupon.usageLimit
      ? Math.max(0, coupon.usageLimit - coupon.usageCount)
      : null;

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (coupon.validUntil - now) / (1000 * 60 * 60 * 24)
    );

    // Calculate days since start
    const daysSinceStart = Math.ceil(
      (now - coupon.validFrom) / (1000 * 60 * 60 * 24)
    );

    // Format coupon for response
    const formattedCoupon = {
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

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon updated successfully",
        data: {
          coupon: formattedCoupon,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update coupon error:", error);

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
        message: error.message || "Failed to update coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons/:id
 * Delete coupon (Admin) - Soft delete
 * Supports both ObjectId and coupon code
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

    // Get coupon ID or code from params
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon ID or code is required",
          errors: [
            {
              field: "id",
              message: "Coupon ID or code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Build query - try as ObjectId first, then as coupon code
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    // Find coupon
    const coupon = await Coupon.findOne(query);

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Check if already deleted
    if (coupon.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon is already deleted",
          errors: [
            {
              field: "coupon",
              message: "This coupon has already been deleted",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Soft delete coupon
    coupon.isDeleted = true;
    coupon.deletedAt = new Date();
    await coupon.save();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Coupon deleted successfully",
        data: {
          coupon: {
            id: coupon._id,
            code: coupon.code,
            name: coupon.name,
            isDeleted: coupon.isDeleted,
            deletedAt: coupon.deletedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}


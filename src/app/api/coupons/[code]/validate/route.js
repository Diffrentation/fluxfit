import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/coupon.model";

/**
 * GET /api/coupons/:code/validate
 * Validate coupon code
 * 
 * Query Parameters:
 * - cartTotal: Cart total amount for validation (optional, default: 0)
 * - userId: User ID for per-user limit validation (optional)
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

    // Get coupon code from params
    const { code } = await params;

    // Validate code
    if (!code || !code.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code is required",
          errors: [
            {
              field: "code",
              message: "Coupon code is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const cartTotal = parseFloat(searchParams.get("cartTotal")) || 0;
    const userId = searchParams.get("userId");

    // Find coupon
    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      isDeleted: false,
    })
      .populate("categories", "name slug")
      .populate("products", "name slug")
      .populate("brands", "name slug")
      .lean();

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid coupon code",
          data: {
            valid: false,
            code: code.trim().toUpperCase(),
            message: "Coupon code not found or inactive",
          },
        },
        { status: 404 }
      );
    }

    // Validate coupon using the model's validate method
    // Since we're using lean(), we need to create a temporary instance or validate manually
    const now = new Date();
    let validationResult = {
      valid: true,
      message: "Coupon is valid",
      errors: [],
    };

    // Check if active
    if (!coupon.isActive || coupon.isDeleted) {
      validationResult = {
        valid: false,
        message: "Coupon is not active",
        errors: [{ field: "status", message: "Coupon is not active" }],
      };
    }
    // Check validity period
    else if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
      validationResult = {
        valid: false,
        message: "Coupon is expired or not yet valid",
        errors: [
          {
            field: "validity",
            message: "Coupon is expired or not yet valid",
          },
        ],
      };
    }
    // Check usage limit
    else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      validationResult = {
        valid: false,
        message: "Coupon usage limit reached",
        errors: [
          {
            field: "usage",
            message: "Coupon usage limit reached",
          },
        ],
      };
    }
    // Check minimum purchase
    else if (cartTotal > 0 && cartTotal < coupon.minPurchase) {
      validationResult = {
        valid: false,
        message: `Minimum purchase of ₹${coupon.minPurchase} required`,
        errors: [
          {
            field: "minPurchase",
            message: `Minimum purchase of ₹${coupon.minPurchase} required`,
          },
        ],
      };
    }
    // Check maximum purchase
    else if (
      cartTotal > 0 &&
      coupon.maxPurchase &&
      cartTotal > coupon.maxPurchase
    ) {
      validationResult = {
        valid: false,
        message: `Maximum purchase of ₹${coupon.maxPurchase} allowed`,
        errors: [
          {
            field: "maxPurchase",
            message: `Maximum purchase of ₹${coupon.maxPurchase} allowed`,
          },
        ],
      };
    }

    // Calculate discount if valid
    let discountAmount = 0;
    if (validationResult.valid && cartTotal > 0) {
      if (coupon.type === "percentage") {
        discountAmount = (cartTotal * coupon.discount) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discount;
        if (discountAmount > cartTotal) {
          discountAmount = cartTotal;
        }
      }
    }

    // Calculate remaining usage
    const remainingUsage = coupon.usageLimit
      ? Math.max(0, coupon.usageLimit - coupon.usageCount)
      : null;

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (new Date(coupon.validUntil) - now) / (1000 * 60 * 60 * 24)
    );

    // Format coupon data
    const couponData = {
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
      perUserLimit: coupon.perUserLimit || 1,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      daysRemaining: daysRemaining,
      applicableTo: coupon.applicableTo,
      categories: coupon.categories || [],
      products: coupon.products || [],
      brands: coupon.brands || [],
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: validationResult.valid
          ? "Coupon validation successful"
          : "Coupon validation failed",
        data: {
          valid: validationResult.valid,
          code: code.trim().toUpperCase(),
          message: validationResult.message,
          errors: validationResult.errors || [],
          coupon: validationResult.valid ? couponData : null,
          discount: validationResult.valid && cartTotal > 0 ? discountAmount : null,
          cartTotal: cartTotal > 0 ? cartTotal : null,
        },
      },
      { status: validationResult.valid ? 200 : 400 }
    );
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to validate coupon. Please try again.",
      },
      { status: 500 }
    );
  }
}


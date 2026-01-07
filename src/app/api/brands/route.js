import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Brand from "@/models/brand.model";
import Product from "@/models/product.model";

/**
 * GET /api/brands
 * Get all brands
 *
 * Query Parameters:
 * - includeInactive: Include inactive brands (default: false)
 * - includeProductCount: Include product count for each brand (default: false)
 * - featured: Filter by featured brands only (default: false)
 * - sort: Sort order - "name", "sortOrder", "productCount" (default: "sortOrder")
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const includeProductCount =
      searchParams.get("includeProductCount") === "true";
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "sortOrder";

    // Build query
    const query = { isDeleted: false };

    if (!includeInactive) {
      query.isActive = true;
    }

    if (featured) {
      query.isFeatured = true;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "name":
        sortObj.name = 1;
        break;
      case "productCount":
        // Will sort after getting product counts
        sortObj.sortOrder = 1;
        sortObj.name = 1;
        break;
      case "sortOrder":
      default:
        sortObj.sortOrder = 1;
        sortObj.name = 1;
        break;
    }

    // Find brands
    const brands = await Brand.find(query).sort(sortObj).lean();

    // Format brands
    let formattedBrands = brands.map((brand) => ({
      id: brand._id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description || null,
      logo: brand.logo || null,
      banner: brand.banner || null,
      website: brand.website || null,
      sortOrder: brand.sortOrder || 0,
      isActive: brand.isActive,
      isFeatured: brand.isFeatured || false,
      metaTitle: brand.metaTitle || null,
      metaDescription: brand.metaDescription || null,
      metaKeywords: brand.metaKeywords || [],
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    // Add product counts if requested
    if (includeProductCount) {
      const brandIds = formattedBrands.map((brand) => brand.id);

      // Get product counts for all brands
      const productCounts = await Product.aggregate([
        {
          $match: {
            brand: { $in: brandIds },
            isDeleted: false,
            status: "active",
          },
        },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map();
      productCounts.forEach((item) => {
        countMap.set(item._id.toString(), item.count);
      });

      formattedBrands = formattedBrands.map((brand) => ({
        ...brand,
        productCount: countMap.get(brand.id.toString()) || 0,
      }));

      // Sort by product count if requested
      if (sort === "productCount") {
        formattedBrands.sort((a, b) => {
          if (b.productCount !== a.productCount) {
            return b.productCount - a.productCount;
          }
          return a.name.localeCompare(b.name);
        });
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Brands retrieved successfully",
        data: {
          brands: formattedBrands,
          count: formattedBrands.length,
          totalBrands: formattedBrands.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get brands error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve brands. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brands
 * Create brand (Admin only)
 */
export async function POST(request) {
  try {
    // Authenticate admin user
    const { authenticateAdmin } = await import("@/lib/auth");
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const {
      name,
      slug,
      description,
      logo,
      banner,
      website,
      sortOrder,
      isActive = true,
      isFeatured = false,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = body;

    // Validate required fields
    const errors = [];

    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Brand name is required",
      });
    }

    // Validate slug if provided
    if (slug) {
      const existingSlug = await Brand.findOne({
        slug: slug.toLowerCase().trim(),
        isDeleted: false,
      });

      if (existingSlug) {
        errors.push({
          field: "slug",
          message: "Brand with this slug already exists",
        });
      }
    }

    // Validate website URL if provided
    if (website && website.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(website.trim())) {
        errors.push({
          field: "website",
          message: "Website must be a valid URL (http:// or https://)",
        });
      }
    }

    // Validate metaDescription length
    if (metaDescription && metaDescription.length > 160) {
      errors.push({
        field: "metaDescription",
        message: "Meta description must be 160 characters or less",
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

    // Build brand data
    const brandData = {
      name: name.trim(),
      description: description?.trim() || null,
      logo: logo?.trim() || null,
      banner: banner?.trim() || null,
      website: website?.trim() || null,
      sortOrder: sortOrder || 0,
      isActive: isActive === true || isActive === "true",
      isFeatured: isFeatured === true || isFeatured === "true",
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      metaKeywords: metaKeywords
        ? metaKeywords
            .map((keyword) => keyword.trim().toLowerCase())
            .filter((keyword) => keyword.length > 0)
        : [],
    };

    // Set slug (will be auto-generated by pre-save hook if not provided)
    if (slug) {
      brandData.slug = slug.toLowerCase().trim();
    }

    // Create brand
    const newBrand = new Brand(brandData);
    await newBrand.save();

    // Format response
    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully",
        data: {
          brand: {
            id: newBrand._id,
            name: newBrand.name,
            slug: newBrand.slug,
            description: newBrand.description || null,
            logo: newBrand.logo || null,
            banner: newBrand.banner || null,
            website: newBrand.website || null,
            sortOrder: newBrand.sortOrder || 0,
            isActive: newBrand.isActive,
            isFeatured: newBrand.isFeatured || false,
            metaTitle: newBrand.metaTitle || null,
            metaDescription: newBrand.metaDescription || null,
            metaKeywords: newBrand.metaKeywords || [],
            createdAt: newBrand.createdAt,
            updatedAt: newBrand.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create brand error:", error);

    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          message: `Brand with this ${field} already exists`,
          errors: [
            {
              field: field,
              message: `A brand with this ${field} already exists`,
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
        message: error.message || "Failed to create brand. Please try again.",
      },
      { status: 500 }
    );
  }
}

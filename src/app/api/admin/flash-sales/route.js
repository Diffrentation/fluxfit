import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FlashSale from "@/models/flashsale.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/admin/flash-sales
 * Get all flash sales (Admin)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (scheduled/active/ended/cancelled)
 * - isActive: Filter by active status (true/false)
 * - search: Search by name or description
 * - sort: Sort order - "newest" (default), "oldest", "ending-soon", "revenue-desc", "sales-desc"
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
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    // Status filter
    if (status) {
      const validStatuses = ["scheduled", "active", "ended", "cancelled"];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Active status filter
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search filter
    if (search) {
      query.$or = [
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
      case "ending-soon":
        sortObj.endDate = 1;
        break;
      case "revenue-desc":
        sortObj.revenue = -1;
        break;
      case "sales-desc":
        sortObj.sales = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [flashSales, total] = await Promise.all([
      FlashSale.find(query)
        .populate("products.product", "name slug images basePrice originalPrice inStock stock category brand")
        .populate("products.product.category", "name slug")
        .populate("products.product.brand", "name logo")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      FlashSale.countDocuments(query),
    ]);

    // Current date for calculations
    const now = new Date();

    // Format flash sales for response
    const formattedFlashSales = flashSales.map((sale) => {
      // Check if currently active
      const isCurrentlyActive =
        sale.isActive &&
        sale.status === "active" &&
        now >= new Date(sale.startDate) &&
        now <= new Date(sale.endDate);

      // Calculate time remaining in seconds
      const timeRemaining = isCurrentlyActive
        ? Math.max(0, Math.floor((new Date(sale.endDate) - now) / 1000))
        : null;

      // Calculate days until start
      const daysUntilStart = Math.ceil(
        (new Date(sale.startDate) - now) / (1000 * 60 * 60 * 24)
      );

      // Calculate days since end
      const daysSinceEnd = Math.ceil(
        (now - new Date(sale.endDate)) / (1000 * 60 * 60 * 24)
      );

      // Format products
      const formattedProducts = sale.products.map((item) => {
        const product = item.product;
        const primaryImage =
          product?.images?.find((img) => img.isPrimary)?.url ||
          product?.images?.[0]?.url ||
          null;

        return {
          id: product?._id || null,
          name: product?.name || null,
          slug: product?.slug || null,
          image: primaryImage,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          discount: item.discount,
          stock: item.stock,
          category: product?.category
            ? {
                id: product.category._id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          brand: product?.brand
            ? {
                id: product.brand._id,
                name: product.brand.name,
                logo: product.brand.logo || null,
              }
            : null,
        };
      });

      return {
        id: sale._id,
        name: sale.name,
        description: sale.description || null,
        banner: sale.banner || null,
        products: formattedProducts,
        productCount: sale.products.length,
        startDate: sale.startDate,
        endDate: sale.endDate,
        status: sale.status,
        isActive: sale.isActive,
        isCurrentlyActive: isCurrentlyActive,
        timeRemaining: timeRemaining,
        daysUntilStart: daysUntilStart,
        daysSinceEnd: daysSinceEnd,
        views: sale.views || 0,
        sales: sale.sales || 0,
        revenue: sale.revenue || 0,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Flash sales retrieved successfully",
        data: {
          flashSales: formattedFlashSales,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            status: status || null,
            isActive: isActive || null,
            search: search || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin flash sales error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve flash sales. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/flash-sales
 * Create flash sale (Admin)
 * 
 * Request Body:
 * - name: Flash sale name (required)
 * - description: Flash sale description (optional)
 * - products: Array of product objects with discount and stock (required)
 *   - product: Product ID (required)
 *   - discount: Discount percentage (required, 0-100)
 *   - stock: Stock available for sale (required, min: 0)
 * - startDate: Start date (required, ISO format)
 * - endDate: End date (required, ISO format)
 * - banner: Banner image URL (optional)
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

    // Import Product model
    const Product = (await import("@/models/product.model")).default;

    // Parse request body
    const body = await request.json();
    const { name, description, products, startDate, endDate, banner, isActive } = body;

    // Validation errors
    const errors = [];

    // Validate required fields
    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Flash sale name is required",
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      errors.push({
        field: "products",
        message: "At least one product is required",
      });
    }

    if (!startDate) {
      errors.push({
        field: "startDate",
        message: "Start date is required",
      });
    }

    if (!endDate) {
      errors.push({
        field: "endDate",
        message: "End date is required",
      });
    }

    // Validate dates
    if (startDate && endDate) {
      const fromDate = new Date(startDate);
      const untilDate = new Date(endDate);

      if (isNaN(fromDate.getTime())) {
        errors.push({
          field: "startDate",
          message: "Invalid start date format",
        });
      }

      if (isNaN(untilDate.getTime())) {
        errors.push({
          field: "endDate",
          message: "Invalid end date format",
        });
      }

      if (
        !isNaN(fromDate.getTime()) &&
        !isNaN(untilDate.getTime()) &&
        fromDate >= untilDate
      ) {
        errors.push({
          field: "endDate",
          message: "End date must be after start date",
        });
      }
    }

    // Validate products
    if (products && Array.isArray(products)) {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        if (!product.product) {
          errors.push({
            field: `products[${i}].product`,
            message: "Product ID is required",
          });
        } else if (!mongoose.Types.ObjectId.isValid(product.product)) {
          errors.push({
            field: `products[${i}].product`,
            message: "Invalid product ID format",
          });
        }

        if (product.discount === undefined || product.discount === null) {
          errors.push({
            field: `products[${i}].discount`,
            message: "Discount is required",
          });
        } else if (
          typeof product.discount !== "number" ||
          product.discount < 0 ||
          product.discount > 100
        ) {
          errors.push({
            field: `products[${i}].discount`,
            message: "Discount must be a number between 0 and 100",
          });
        }

        if (product.stock === undefined || product.stock === null) {
          errors.push({
            field: `products[${i}].stock`,
            message: "Stock is required",
          });
        } else if (typeof product.stock !== "number" || product.stock < 0) {
          errors.push({
            field: `products[${i}].stock`,
            message: "Stock must be a non-negative number",
          });
        }
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

    // Validate products exist and get their prices
    const validatedProducts = [];
    for (const productItem of products) {
      const product = await Product.findOne({
        _id: productItem.product,
        isDeleted: false,
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: `Product with ID ${productItem.product} not found`,
            errors: [
              {
                field: "products",
                message: `Product with ID ${productItem.product} not found or deleted`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // Get product price (use variant price if needed, or basePrice)
      const originalPrice = product.basePrice;
      const salePrice = originalPrice - (originalPrice * productItem.discount) / 100;

      validatedProducts.push({
        product: product._id,
        discount: productItem.discount,
        originalPrice: originalPrice,
        salePrice: salePrice,
        stock: productItem.stock,
      });
    }

    // Create flash sale data
    const flashSaleData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      products: validatedProducts,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      banner: banner || null,
      isActive: isActive !== undefined ? isActive : true,
      status: "scheduled", // Will be updated by pre-save hook
      views: 0,
      sales: 0,
      revenue: 0,
    };

    // Create flash sale
    const newFlashSale = new FlashSale(flashSaleData);
    await newFlashSale.save();

    // Populate flash sale for response
    await newFlashSale.populate({
      path: "products.product",
      select: "name slug images basePrice originalPrice inStock stock category brand",
      populate: [
        {
          path: "category",
          select: "name slug",
        },
        {
          path: "brand",
          select: "name logo",
        },
      ],
    });

    // Format products for response
    const formattedProducts = newFlashSale.products.map((item) => {
      const product = item.product;
      const primaryImage =
        product?.images?.find((img) => img.isPrimary)?.url ||
        product?.images?.[0]?.url ||
        null;

      return {
        id: product?._id || null,
        name: product?.name || null,
        slug: product?.slug || null,
        image: primaryImage,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        discount: item.discount,
        stock: item.stock,
        category: product?.category
          ? {
              id: product.category._id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : null,
        brand: product?.brand
          ? {
              id: product.brand._id,
              name: product.brand.name,
              logo: product.brand.logo || null,
            }
          : null,
      };
    });

    // Format flash sale for response
    const formattedFlashSale = {
      id: newFlashSale._id,
      name: newFlashSale.name,
      description: newFlashSale.description || null,
      banner: newFlashSale.banner || null,
      products: formattedProducts,
      productCount: newFlashSale.products.length,
      startDate: newFlashSale.startDate,
      endDate: newFlashSale.endDate,
      status: newFlashSale.status,
      isActive: newFlashSale.isActive,
      views: newFlashSale.views || 0,
      sales: newFlashSale.sales || 0,
      revenue: newFlashSale.revenue || 0,
      createdAt: newFlashSale.createdAt,
      updatedAt: newFlashSale.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Flash sale created successfully",
        data: {
          flashSale: formattedFlashSale,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create flash sale error:", error);

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
        message: error.message || "Failed to create flash sale. Please try again.",
      },
      { status: 500 }
    );
  }
}


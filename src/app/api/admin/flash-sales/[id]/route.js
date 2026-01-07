import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FlashSale from "@/models/flashsale.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/flash-sales/:id
 * Update flash sale (Admin)
 * 
 * Request Body: (all fields optional)
 * - name: Flash sale name
 * - description: Flash sale description
 * - products: Array of product objects with discount and stock
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - banner: Banner image URL
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

    // Import Product model
    const Product = (await import("@/models/product.model")).default;

    // Get flash sale ID from params
    const { id } = await params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid flash sale ID is required",
          errors: [
            {
              field: "id",
              message: "Valid flash sale ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, products, startDate, endDate, banner, isActive } = body;

    // Find flash sale
    const flashSale = await FlashSale.findById(id);

    if (!flashSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Flash sale not found",
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
          message: "Flash sale name cannot be empty",
        });
      } else {
        updateData.name = name.trim();
      }
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (startDate !== undefined) {
      const fromDate = new Date(startDate);
      if (isNaN(fromDate.getTime())) {
        errors.push({
          field: "startDate",
          message: "Invalid start date format",
        });
      } else {
        updateData.startDate = fromDate;
      }
    }

    if (endDate !== undefined) {
      const untilDate = new Date(endDate);
      if (isNaN(untilDate.getTime())) {
        errors.push({
          field: "endDate",
          message: "Invalid end date format",
        });
      } else {
        updateData.endDate = untilDate;
      }
    }

    // Validate date range
    const finalStartDate = startDate !== undefined ? new Date(startDate) : flashSale.startDate;
    const finalEndDate = endDate !== undefined ? new Date(endDate) : flashSale.endDate;
    if (
      !isNaN(finalStartDate.getTime()) &&
      !isNaN(finalEndDate.getTime()) &&
      finalStartDate >= finalEndDate
    ) {
      errors.push({
        field: "endDate",
        message: "End date must be after start date",
      });
    }

    if (banner !== undefined) {
      updateData.banner = banner || null;
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

    // Validate products if provided
    if (products !== undefined) {
      if (!Array.isArray(products)) {
        errors.push({
          field: "products",
          message: "Products must be an array",
        });
      } else if (products.length === 0) {
        errors.push({
          field: "products",
          message: "At least one product is required",
        });
      } else {
        // Validate each product
        const validatedProducts = [];
        for (let i = 0; i < products.length; i++) {
          const productItem = products[i];

          if (!productItem.product) {
            errors.push({
              field: `products[${i}].product`,
              message: "Product ID is required",
            });
            continue;
          }

          if (!mongoose.Types.ObjectId.isValid(productItem.product)) {
            errors.push({
              field: `products[${i}].product`,
              message: "Invalid product ID format",
            });
            continue;
          }

          const product = await Product.findOne({
            _id: productItem.product,
            isDeleted: false,
          });

          if (!product) {
            errors.push({
              field: `products[${i}].product`,
              message: `Product with ID ${productItem.product} not found or deleted`,
            });
            continue;
          }

          if (productItem.discount === undefined || productItem.discount === null) {
            errors.push({
              field: `products[${i}].discount`,
              message: "Discount is required",
            });
            continue;
          }

          if (
            typeof productItem.discount !== "number" ||
            productItem.discount < 0 ||
            productItem.discount > 100
          ) {
            errors.push({
              field: `products[${i}].discount`,
              message: "Discount must be a number between 0 and 100",
            });
            continue;
          }

          if (productItem.stock === undefined || productItem.stock === null) {
            errors.push({
              field: `products[${i}].stock`,
              message: "Stock is required",
            });
            continue;
          }

          if (typeof productItem.stock !== "number" || productItem.stock < 0) {
            errors.push({
              field: `products[${i}].stock`,
              message: "Stock must be a non-negative number",
            });
            continue;
          }

          // Calculate sale price
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

        if (validatedProducts.length > 0) {
          updateData.products = validatedProducts;
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

    // Update flash sale
    Object.assign(flashSale, updateData);
    await flashSale.save();

    // Populate flash sale for response
    await flashSale.populate({
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

    // Current date for calculations
    const now = new Date();
    const isCurrentlyActive =
      flashSale.isActive &&
      flashSale.status === "active" &&
      now >= flashSale.startDate &&
      now <= flashSale.endDate;

    // Format products for response
    const formattedProducts = flashSale.products.map((item) => {
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
      id: flashSale._id,
      name: flashSale.name,
      description: flashSale.description || null,
      banner: flashSale.banner || null,
      products: formattedProducts,
      productCount: flashSale.products.length,
      startDate: flashSale.startDate,
      endDate: flashSale.endDate,
      status: flashSale.status,
      isActive: flashSale.isActive,
      isCurrentlyActive: isCurrentlyActive,
      views: flashSale.views || 0,
      sales: flashSale.sales || 0,
      revenue: flashSale.revenue || 0,
      createdAt: flashSale.createdAt,
      updatedAt: flashSale.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Flash sale updated successfully",
        data: {
          flashSale: formattedFlashSale,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update flash sale error:", error);

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
        message: error.message || "Failed to update flash sale. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/flash-sales/:id
 * Delete flash sale (Admin) - Hard delete
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

    // Get flash sale ID from params
    const { id } = await params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid flash sale ID is required",
          errors: [
            {
              field: "id",
              message: "Valid flash sale ID is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Find flash sale
    const flashSale = await FlashSale.findById(id);

    if (!flashSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Flash sale not found",
        },
        { status: 404 }
      );
    }

    // Store flash sale info before deletion
    const flashSaleInfo = {
      id: flashSale._id,
      name: flashSale.name,
      status: flashSale.status,
    };

    // Delete flash sale (hard delete)
    await FlashSale.findByIdAndDelete(id);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Flash sale deleted successfully",
        data: {
          flashSale: flashSaleInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete flash sale error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete flash sale. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";

/**
 * GET /api/products/filters
 * Get available filters (categories, colors, price ranges, sizes, tags, brands)
 * Returns all available filter options based on active products
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters for optional filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    // Build base query for active products
    const productQuery = {
      isDeleted: false,
      status: "active",
    };

    // Apply optional filters to get relevant filter options
    if (category) {
      productQuery.category = category;
    }
    if (brand) {
      productQuery.brand = brand;
    }

    // Get all active products for filter extraction
    const products = await Product.find(productQuery)
      .select("category brand basePrice colors sizes tags variants")
      .populate("category", "name slug")
      .populate("brand", "name logo")
      .lean();

    // Extract unique categories
    const categoryMap = new Map();
    products.forEach((product) => {
      if (product.category) {
        const catId = product.category._id.toString();
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug,
            count: 0,
          });
        }
        categoryMap.get(catId).count++;
      }
    });
    const categories = Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Extract unique brands
    const brandMap = new Map();
    products.forEach((product) => {
      if (product.brand) {
        const brandId = product.brand._id.toString();
        if (!brandMap.has(brandId)) {
          brandMap.set(brandId, {
            id: product.brand._id,
            name: product.brand.name,
            slug: product.brand.slug,
            logo: product.brand.logo || null,
            count: 0,
          });
        }
        brandMap.get(brandId).count++;
      }
    });
    const brands = Array.from(brandMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Extract unique colors — most products only set this on individual
    // variants rather than the top-level colors array, so fall back to
    // variants[].color whenever the top-level array is empty.
    const colorMap = new Map();
    products.forEach((product) => {
      const productColors =
        Array.isArray(product.colors) && product.colors.length > 0
          ? product.colors
          : (product.variants || []).map((v) => v.color).filter(Boolean);
      productColors.forEach((color) => {
        if (color && color.trim()) {
          const colorKey = color.trim().toLowerCase();
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, {
              name: color.trim(),
              count: 0,
            });
          }
          colorMap.get(colorKey).count++;
        }
      });
    });
    const colors = Array.from(colorMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((color) => ({
        name: color.name,
        count: color.count,
      }));

    // Extract unique sizes — same variants[].size fallback as colors above.
    const sizeMap = new Map();
    products.forEach((product) => {
      const productSizes =
        Array.isArray(product.sizes) && product.sizes.length > 0
          ? product.sizes
          : (product.variants || []).map((v) => v.size).filter(Boolean);
      productSizes.forEach((size) => {
        if (size && size.trim()) {
          const sizeKey = size.trim().toUpperCase();
          if (!sizeMap.has(sizeKey)) {
            sizeMap.set(sizeKey, {
              name: size.trim(),
              count: 0,
            });
          }
          sizeMap.get(sizeKey).count++;
        }
      });
    });
    const sizes = Array.from(sizeMap.values())
      .sort((a, b) => {
        // Sort sizes logically (XS, S, M, L, XL, XXL, etc.)
        const sizeOrder = [
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "XXXL",
          "ONE SIZE",
        ];
        const aIndex = sizeOrder.indexOf(a.name.toUpperCase());
        const bIndex = sizeOrder.indexOf(b.name.toUpperCase());
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((size) => ({
        name: size.name,
        count: size.count,
      }));

    // Extract unique tags
    const tagMap = new Map();
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            const tagKey = tag.trim().toLowerCase();
            if (!tagMap.has(tagKey)) {
              tagMap.set(tagKey, {
                name: tag.trim(),
                count: 0,
              });
            }
            tagMap.get(tagKey).count++;
          }
        });
      }
    });
    const tags = Array.from(tagMap.values())
      .sort((a, b) => b.count - a.count) // Sort by count (most popular first)
      .map((tag) => ({
        name: tag.name,
        count: tag.count,
      }));

    // Calculate price range
    const prices = products
      .map((p) => p.basePrice || 0)
      .filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Generate price ranges
    const priceRanges = [];
    if (maxPrice > 0) {
      const step = Math.ceil((maxPrice - minPrice) / 5) || 1000;
      let currentMin = Math.floor(minPrice / step) * step;
      
      while (currentMin < maxPrice) {
        const currentMax = Math.min(currentMin + step, maxPrice);
        const count = products.filter(
          (p) =>
            p.basePrice >= currentMin &&
            p.basePrice <= currentMax &&
            p.basePrice > 0
        ).length;

        if (count > 0) {
          priceRanges.push({
            min: currentMin,
            max: currentMax === maxPrice ? null : currentMax,
            label:
              currentMax === maxPrice
                ? `₹${currentMin.toLocaleString()}+`
                : `₹${currentMin.toLocaleString()} - ₹${currentMax.toLocaleString()}`,
            count,
          });
        }
        currentMin = currentMax;
      }
    }

    // Get all active categories from database (for complete list)
    const allCategories = await Category.find({
      isDeleted: false,
      isActive: true,
    })
      .select("name slug")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Get all active brands from database (for complete list)
    const allBrands = await Brand.find({
      isDeleted: false,
      isActive: true,
    })
      .select("name slug logo")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Filters retrieved successfully",
        data: {
          categories: allCategories.map((cat) => ({
            id: cat._id,
            name: cat.name,
            slug: cat.slug,
            productCount:
              categories.find((c) => c.id.toString() === cat._id.toString())
                ?.count || 0,
          })),
          brands: allBrands.map((br) => ({
            id: br._id,
            name: br.name,
            slug: br.slug,
            logo: br.logo || null,
            productCount:
              brands.find((b) => b.id.toString() === br._id.toString())
                ?.count || 0,
          })),
          colors: colors,
          sizes: sizes,
          tags: tags,
          priceRange: {
            min: minPrice,
            max: maxPrice,
            ranges: priceRanges,
          },
          stats: {
            totalProducts: products.length,
            totalCategories: allCategories.length,
            totalBrands: allBrands.length,
            totalColors: colors.length,
            totalSizes: sizes.length,
            totalTags: tags.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get filters error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve filters. Please try again.",
      },
      { status: 500 }
    );
  }
}


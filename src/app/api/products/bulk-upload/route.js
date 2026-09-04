import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import { parseCSV, validateBulkProducts } from "@/lib/csvParser";
import mongoose from "mongoose";
import slugify from "slugify";

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * POST /api/products/bulk-upload
 * Bulk upload products via CSV (Admin only)
 *
 * Request body should contain CSV text or file
 * Expected CSV format:
 * name,description,basePrice,originalPrice,category,brand,stock,colors,sizes,tags,images,status
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
    const { csvText, csvData } = body;

    // Get CSV content
    let csvContent;
    if (csvText) {
      csvContent = csvText;
    } else if (csvData) {
      // If csvData is provided as array, convert to CSV format
      if (Array.isArray(csvData)) {
        // Assume first row is headers
        const headers = Object.keys(csvData[0] || {});
        const csvLines = [headers.join(",")];
        csvData.forEach((row) => {
          const values = headers.map((h) => {
            const val = row[h];
            // Handle values with commas or quotes
            if (val && (val.includes(",") || val.includes('"'))) {
              return `"${String(val).replace(/"/g, '""')}"`;
            }
            return val || "";
          });
          csvLines.push(values.join(","));
        });
        csvContent = csvLines.join("\n");
      } else {
        csvContent = csvData;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "CSV data is required",
          errors: [
            {
              field: "csvText",
              message: "Please provide CSV text or csvData",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Parse CSV
    let parsedProducts;
    try {
      parsedProducts = parseCSV(csvContent);
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to parse CSV file",
          errors: [
            {
              field: "csvText",
              message: parseError.message || "Invalid CSV format",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!parsedProducts || parsedProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No products found in CSV file",
        },
        { status: 400 }
      );
    }

    // Validate products
    const validation = validateBulkProducts(parsedProducts);

    if (validation.invalid.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Some products have validation errors",
          data: {
            valid: validation.valid.length,
            invalid: validation.invalid.length,
            total: validation.total,
            invalidProducts: validation.invalid.map((item) => ({
              row: item.index,
              errors: item.errors,
              product: item.product,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Process and create products
    const results = {
      created: [],
      failed: [],
      skipped: [],
      warnings: [],
    };
    const slugsUsedInBatch = new Set();

    for (let i = 0; i < validation.valid.length; i++) {
      const productData = validation.valid[i];

      try {
        // Map CSV data to product schema
        const productFields = {
          name: productData.name?.trim(),
          description:
            productData.description?.trim() || productData.name?.trim() || "",
          shortDescription:
            productData.shortDescription?.trim() ||
            productData.description?.substring(0, 200) ||
            "",
          basePrice:
            parseFloat(productData.price || productData.basePrice) || 0,
          originalPrice: productData.originalPrice
            ? parseFloat(productData.originalPrice)
            : undefined,
          discount: productData.discount ? parseFloat(productData.discount) : 0,
          stock: parseInt(productData.stock || productData.quantity || 0) || 0,
          inStock:
            (parseInt(productData.stock || productData.quantity || 0) || 0) > 0,
          status: productData.status || "draft",
          isFeatured:
            productData.isFeatured === "true" ||
            productData.isFeatured === true,
          isNew: productData.isNew === "true" || productData.isNew === true,
          isPopular:
            productData.isPopular === "true" || productData.isPopular === true,
        };

        // Generate slug if not provided. Uses the same slugify() rules as the
        // single-product create/update routes so slugs are consistent
        // (unicode/diacritics handling, etc.) whichever path created them.
        if (!productData.slug && productFields.name) {
          productFields.slug = slugify(productFields.name, {
            lower: true,
            strict: true,
            trim: true,
          });
        } else if (productData.slug) {
          productFields.slug = slugify(productData.slug, {
            lower: true,
            strict: true,
            trim: true,
          });
        }

        // Handle category - try to find by name or ID
        if (productData.category) {
          let category;
          if (mongoose.Types.ObjectId.isValid(productData.category)) {
            category = await Category.findById(productData.category);
          } else {
            category = await Category.findOne({
              $or: [
                {
                  name: {
                    $regex: new RegExp(`^${escapeRegex(productData.category)}$`, "i"),
                  },
                },
                { slug: productData.category.toLowerCase() },
              ],
            });
          }

          if (category) {
            productFields.category = category._id;
          } else {
            results.skipped.push({
              index: i + 2,
              product: productFields.name,
              reason: `Category "${productData.category}" not found`,
            });
            continue;
          }
        } else {
          results.skipped.push({
            index: i + 2,
            product: productFields.name,
            reason: "Category is required",
          });
          continue;
        }

        // Handle brand - try to find by name or ID
        if (productData.brand) {
          let brand;
          if (mongoose.Types.ObjectId.isValid(productData.brand)) {
            brand = await Brand.findById(productData.brand);
          } else {
            brand = await Brand.findOne({
              $or: [
                { name: { $regex: new RegExp(`^${escapeRegex(productData.brand)}$`, "i") } },
                { slug: productData.brand.toLowerCase() },
              ],
            });
          }

          if (brand) {
            productFields.brand = brand._id;
          }
        }

        // Handle images
        if (productData.image || productData.images) {
          const imageUrls = productData.images
            ? productData.images.split("|").map((url) => url.trim())
            : [productData.image.trim()];

          productFields.images = imageUrls.map((url, index) => ({
            url: url,
            alt: productFields.name || `Product image ${index + 1}`,
            isPrimary: index === 0,
          }));
        }

        // Handle colors
        if (productData.colors || productData.color) {
          const colors = productData.colors
            ? productData.colors.split(",").map((c) => c.trim())
            : [productData.color.trim()];
          productFields.colors = colors.filter((c) => c);
        }

        // Handle sizes
        if (productData.sizes || productData.size) {
          const sizes = productData.sizes
            ? productData.sizes.split(",").map((s) => s.trim())
            : [productData.size.trim()];
          productFields.sizes = sizes.filter((s) => s);
        }

        // Handle tags
        if (productData.tags) {
          const tags = productData.tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t);
          productFields.tags = tags;
        }

        // Handle features
        if (productData.features) {
          const features = productData.features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f);
          productFields.features = features;
        }

        // Handle variants if provided
        let variantsParseError = null;
        if (productData.variants) {
          try {
            const variants = JSON.parse(productData.variants);
            if (Array.isArray(variants)) {
              productFields.variants = variants;
            } else {
              variantsParseError = "variants column must be a JSON array";
            }
          } catch (e) {
            variantsParseError = `variants column is not valid JSON: ${e.message}`;
          }
        } else if (productData.size && productData.color) {
          // Create a single variant from size and color
          productFields.variants = [
            {
              size: productData.size.trim(),
              color: productData.color.trim(),
              price: productFields.basePrice,
              stock: productFields.stock,
              isActive: true,
            },
          ];
        }

        // Handle SEO fields
        if (productData.metaTitle) {
          productFields.metaTitle = productData.metaTitle.trim();
        }
        if (productData.metaDescription) {
          productFields.metaDescription = productData.metaDescription.trim();
        }
        if (productData.metaKeywords) {
          const keywords = productData.metaKeywords
            .split(",")
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k);
          productFields.metaKeywords = keywords;
        }

        // Check if product with same slug already exists in the DB, or
        // earlier in this same CSV batch (rows sharing a name would
        // otherwise both pass the DB check before either is saved, and the
        // second insert would fail with an opaque duplicate-key error).
        const existingProduct = await Product.findOne({
          slug: productFields.slug,
          isDeleted: false,
        });

        if (existingProduct || slugsUsedInBatch.has(productFields.slug)) {
          results.skipped.push({
            index: i + 2,
            product: productFields.name,
            reason: existingProduct
              ? `Product with slug "${productFields.slug}" already exists`
              : `Duplicate slug "${productFields.slug}" earlier in this CSV file`,
          });
          continue;
        }
        slugsUsedInBatch.add(productFields.slug);

        if (variantsParseError) {
          results.warnings.push({
            index: i + 2,
            product: productFields.name,
            warning: `${variantsParseError} — product created without variants`,
          });
        }

        // Create product
        const newProduct = new Product(productFields);
        await newProduct.save();

        results.created.push({
          id: newProduct._id,
          name: newProduct.name,
          slug: newProduct.slug,
        });
      } catch (createError) {
        console.error(`Error creating product at row ${i + 2}:`, createError);
        results.failed.push({
          index: i + 2,
          product: productData.name || "Unknown",
          error: createError.message || "Failed to create product",
        });
      }
    }

    // Return results
    return NextResponse.json(
      {
        success: true,
        message: "Bulk upload completed",
        data: {
          summary: {
            total: validation.total,
            created: results.created.length,
            failed: results.failed.length,
            skipped: results.skipped.length,
            warnings: results.warnings.length,
          },
          created: results.created,
          failed: results.failed,
          skipped: results.skipped,
          warnings: results.warnings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to process bulk upload. Please try again.",
      },
      { status: 500 }
    );
  }
}

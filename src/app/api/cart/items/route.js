import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import "@/models/category.model";
import { authenticateUser } from "@/lib/auth";
import { isStrictMongoObjectIdString } from "@/lib/mongoose-id";

/**
 * POST /api/cart/items
 * Add item to cart (authenticated). Cart document is created if missing.
 */
export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    if (!user?._id) {
      console.error("[api/cart/items] authenticateUser returned no user._id");
      return NextResponse.json(
        {
          success: false,
          message: "Authentication failed",
          errors: [{ field: "auth", message: "User could not be resolved" }],
        },
        { status: 401 },
      );
    }

    const userId = user._id.toString();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
          errors: [{ field: "body", message: "Request body must be valid JSON" }],
        },
        { status: 400 },
      );
    }

    const rawVariant = body?.variant && typeof body.variant === "object" ? body.variant : {};
    const productIdRaw = body?.productId;
    const quantityRaw = body?.quantity;

    const productId =
      productIdRaw != null ? String(productIdRaw).trim() : "";

    console.log("[api/cart/items] POST", { productId, userId });

    const errors = [];

    if (!productId) {
      errors.push({
        field: "productId",
        message: "Product ID is required",
      });
    } else if (!isStrictMongoObjectIdString(productId)) {
      errors.push({
        field: "productId",
        message:
          "Invalid product ID: must be a 24-character hexadecimal MongoDB ObjectId",
      });
    }

    if (quantityRaw === undefined || quantityRaw === null) {
      errors.push({
        field: "quantity",
        message: "Quantity is required",
      });
    } else {
      const qty = Number(quantityRaw);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        errors.push({
          field: "quantity",
          message: "Quantity must be a whole number greater than 0",
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 },
      );
    }

    const quantity = Number(quantityRaw);

    const variant = {
      size:
        rawVariant.size != null && String(rawVariant.size).trim() !== ""
          ? String(rawVariant.size).trim()
          : null,
      color:
        rawVariant.color != null && String(rawVariant.color).trim() !== ""
          ? String(rawVariant.color).trim()
          : null,
    };

    const customization =
      body?.customization != null && typeof body.customization === "object"
        ? body.customization
        : null;

    await connectDB();

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      status: "active",
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or not available",
          errors: [
            {
              field: "productId",
              message: "No active product exists for this id",
            },
          ],
        },
        { status: 404 },
      );
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (!product.inStock) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is out of stock",
          errors: [
            {
              field: "product",
              message: "This product is currently out of stock",
            },
          ],
        },
        { status: 400 },
      );
    }

    const normalizeVariantValue = (value) =>
      String(value ?? "").trim().toLowerCase();

    let itemPrice = product.basePrice;
    let matchingVariant = null;

    if (variant.size || variant.color) {
      matchingVariant = variants.find((v) => {
        const sizeMatch =
          !variant.size ||
          normalizeVariantValue(v.size) === normalizeVariantValue(variant.size);
        const colorMatch =
          !variant.color ||
          normalizeVariantValue(v.color) === normalizeVariantValue(variant.color);
        return sizeMatch && colorMatch && v.isActive !== false;
      });

      if (!matchingVariant) {
        return NextResponse.json(
          {
            success: false,
            message: "Product variant not found or not available",
            errors: [
              {
                field: "variant",
                message: `Variant with size "${variant.size ?? "N/A"}" and color "${variant.color ?? "N/A"}" not found`,
              },
            ],
          },
          { status: 400 },
        );
      }

      itemPrice = matchingVariant.price;
      // Persist the variant values exactly as stored in the catalog so later
      // cart operations use one consistent size/color representation.
      variant.size = matchingVariant.size ?? variant.size;
      variant.color = matchingVariant.color ?? variant.color;
    }

    const variantForStock = matchingVariant;

    const availableStock = variantForStock
      ? variantForStock.stock ?? 0
      : product.stock ?? 0;

    if (availableStock < quantity) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient stock",
          errors: [
            {
              field: "quantity",
              message: `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock`,
            },
          ],
        },
        { status: 400 },
      );
    }

    const cart = await Cart.getOrCreate(user._id);

    await cart.addItem(productId, variant, quantity, itemPrice, customization);

    await cart.populate({
      path: "items.product",
      select: "name slug images basePrice originalPrice inStock stock category",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    const itemProductKey = (item) => {
      const p = item.product;
      if (!p) return null;
      return p._id != null ? p._id.toString() : String(p);
    };

    const addedItem = cart.items.find((item) => {
      if (itemProductKey(item) !== productId) return false;
      const s = item.variant?.size ?? null;
      const c = item.variant?.color ?? null;
      return s === variant.size && c === variant.color;
    });

    if (!addedItem) {
      console.error("[api/cart/items] added line not found after save", {
        productId,
        userId,
        itemCount: cart.items.length,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Cart updated but line item could not be read back",
          errors: [{ field: "cart", message: "Internal cart state error" }],
        },
        { status: 500 },
      );
    }

    const populatedProduct = addedItem.product;
    const primaryImage =
      populatedProduct?.images?.find((img) => img.isPrimary)?.url ||
      populatedProduct?.images?.[0]?.url ||
      null;

    const category =
      populatedProduct?.category &&
      typeof populatedProduct.category === "object" &&
      populatedProduct.category.name
        ? {
            id: populatedProduct.category._id,
            name: populatedProduct.category.name,
            slug: populatedProduct.category.slug,
          }
        : null;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    if (cart.coupon?.code) {
      if (cart.coupon.type === "percentage") {
        discountAmount = (subtotal * cart.coupon.discount) / 100;
      } else {
        discountAmount = cart.coupon.discount;
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart successfully",
        data: {
          item: {
            id: addedItem._id,
            product: {
              id: populatedProduct?._id ?? product._id,
              name: populatedProduct?.name ?? product.name,
              slug: populatedProduct?.slug ?? product.slug,
              image: primaryImage,
              category,
              inStock: populatedProduct?.inStock ?? product.inStock,
              stock: populatedProduct?.stock ?? product.stock,
            },
            variant: {
              size: addedItem.variant?.size ?? null,
              color: addedItem.variant?.color ?? null,
            },
            customization: addedItem.customization ?? null,
            quantity: addedItem.quantity,
            price: addedItem.price,
            subtotal: addedItem.price * addedItem.quantity,
            addedAt: addedItem.addedAt,
          },
          cart: {
            itemCount,
            subtotal,
            total,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add item to cart error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to add item to cart. Please try again.",
      },
      { status: 500 },
    );
  }
}

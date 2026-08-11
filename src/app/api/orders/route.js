import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import "@/models/category.model";
import "@/models/brand.model";
import { authenticateUser } from "@/lib/auth";
import { isStrictMongoObjectIdString } from "@/lib/mongoose-id";
import { ACTIVE_PAYMENT_METHODS } from "@/lib/paymentMethods";
import { resolveShippingCost, resolveTaxRatePercent } from "@/lib/pricing";

/**
 * Same rules as Order.calculateTotals — computed on the server from line items + cart coupon + shipping.
 */
function computeOrderPricingFromLineItems(
  orderItems,
  cartCoupon,
  shippingCost,
  taxRatePercent,
) {
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  let discount = 0;
  if (cartCoupon?.code) {
    const raw = Number(cartCoupon.discount ?? 0);
    if (cartCoupon.type === "percentage") {
      discount = (subtotal * raw) / 100;
    } else {
      discount = raw;
    }
  }
  if (discount < 0) discount = 0;
  if (discount > subtotal) discount = subtotal;

  const taxableAmount = subtotal - discount;
  const gst = (taxableAmount * taxRatePercent) / 100;
  const total = taxableAmount + gst + shippingCost;

  return {
    subtotal,
    discount,
    tax: { gst, total: gst, ratePercent: taxRatePercent },
    total,
  };
}

/**
 * GET /api/orders
 * Get user's orders (with filters)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by order status
 * - paymentStatus: Filter by payment status
 * - startDate: Filter orders from this date (ISO format)
 * - endDate: Filter orders until this date (ISO format)
 * - sort: Sort order - "newest" (default), "oldest", "total-asc", "total-desc"
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
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
    const paymentStatus = searchParams.get("paymentStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {
      user: user._id,
    };

    // Status filter
    if (status) {
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Payment status filter
    if (paymentStatus) {
      const validPaymentStatuses = [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ];
      if (validPaymentStatuses.includes(paymentStatus)) {
        query["payment.status"] = paymentStatus;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "total-asc":
        sortObj.total = 1;
        break;
      case "total-desc":
        sortObj.total = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product", "name slug images")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    console.log("[api/orders] GET list", {
      userId: String(user._id),
      count: orders.length,
      total,
      page,
    });

    // Format orders for response
    const formattedOrders = orders.map((order) => {
      // Get primary image for each item
      const formattedItems = order.items.map((item) => {
        const product = item.product;
        const primaryImage =
          product?.images?.find((img) => img.isPrimary)?.url ||
          product?.images?.[0]?.url ||
          item.productImage ||
          null;

        return {
          id: item._id,
          product: {
            id: product?._id || null,
            name: item.productName,
            slug: product?.slug || null,
            image: primaryImage,
          },
          variant: {
            size: item.variant.size || null,
            color: item.variant.color || null,
            sku: item.variant.sku || null,
          },
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice || null,
          discount: item.discount || 0,
          total: item.total,
          status: item.status,
          customization: item.customization || null,
          returnRequested: item.returnRequested || false,
          refundRequested: item.refundRequested || false,
        };
      });

      return {
        id: order._id,
        orderNumber: order.orderNumber,
        items: formattedItems,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        subtotal: order.subtotal,
        discount: order.discount,
        coupon: order.coupon.code
          ? {
              code: order.coupon.code,
              discount: order.coupon.discount,
              type: order.coupon.type,
            }
          : null,
        shipping: {
          method: order.shipping.method,
          cost: order.shipping.cost,
          estimatedDays: order.shipping.estimatedDays,
        },
        tax: {
          gst: order.tax.gst || 0,
          total: order.tax.total || 0,
        },
        total: order.total,
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          transactionId: order.payment.transactionId || null,
          paidAt: order.payment.paidAt || null,
        },
        status: order.status,
        statusHistory: order.statusHistory || [],
        delivery: {
          partner: order.delivery.partner || null,
          trackingNumber: order.delivery.trackingNumber || null,
          estimatedDelivery: order.delivery.estimatedDelivery || null,
          deliveredAt: order.delivery.deliveredAt || null,
        },
        cancellation: order.cancellation.requested
          ? {
              requested: true,
              reason: order.cancellation.reason,
              cancelledAt: order.cancellation.cancelledAt,
            }
          : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    // Return response (top-level `orders` + `data` for client compatibility)
    return NextResponse.json(
      {
        success: true,
        message: "Orders retrieved successfully",
        orders: formattedOrders,
        data: {
          orders: formattedOrders,
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
            paymentStatus: paymentStatus || null,
            startDate: startDate || null,
            endDate: endDate || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve orders. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates an order from the authenticated user's server cart (line prices from DB products),
 * OR — when `directItem` is provided — a "Buy Now" order for exactly one product/variant,
 * bypassing the cart entirely (the user's real cart is never read, mutated, or cleared).
 * Body: shippingAddressId (required), paymentMethod (required), shippingCost (optional number),
 * optional billingAddressId, shippingMethod, clearCart, paymentId, transactionId, notes,
 * directItem: { productId, size?, color?, quantity }.
 * Ignores any client-supplied subtotal, total, price, or orderNumber — those are computed server-side.
 */
export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    if (!user?._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          errors: [
            { field: "auth", message: "User could not be resolved" },
          ],
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

    const {
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      paymentId,
      transactionId,
      shippingMethod = "standard",
      shippingCost: shippingCostRaw = 0,
      notes,
      clearCart = true,
      // Buy Now: { productId, size, color, quantity } — bypasses the server
      // Cart entirely so the order contains ONLY this product/variant and
      // the user's real cart is never read, mutated, or cleared.
      directItem,
    } = body;

    const errors = [];
    const shippingIdStr =
      shippingAddressId != null ? String(shippingAddressId).trim() : "";

    if (!shippingIdStr) {
      errors.push({
        field: "shippingAddressId",
        message: "Shipping address ID is required",
      });
    } else if (!isStrictMongoObjectIdString(shippingIdStr)) {
      errors.push({
        field: "shippingAddressId",
        message: "Invalid shipping address ID format",
      });
    }

    if (!paymentMethod) {
      errors.push({
        field: "paymentMethod",
        message: "Payment method is required",
      });
    } else if (!ACTIVE_PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push({
        field: "paymentMethod",
        message:
          "Only Cash on Delivery is currently available. Other payment methods are coming soon.",
      });
    }

    const isDirect = directItem != null && typeof directItem === "object";
    let directProductId = "";
    let directQuantity = 0;

    if (isDirect) {
      directProductId =
        directItem.productId != null ? String(directItem.productId).trim() : "";
      if (!directProductId) {
        errors.push({ field: "directItem.productId", message: "Product ID is required" });
      } else if (!isStrictMongoObjectIdString(directProductId)) {
        errors.push({
          field: "directItem.productId",
          message: "Invalid product ID: must be a 24-character hexadecimal MongoDB ObjectId",
        });
      }

      const qty = Number(directItem.quantity);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        errors.push({
          field: "directItem.quantity",
          message: "Quantity must be a whole number greater than 0",
        });
      } else {
        directQuantity = qty;
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

    await connectDB();

    const Address = (await import("@/models/address.model")).default;

    // sourceItems is fed through the exact same per-item validation/pricing/
    // stock-decrement loop below regardless of origin, so Buy Now and normal
    // cart checkout share one code path and can't drift apart.
    let cart = null;
    let sourceItems;

    if (isDirect) {
      const Product = (await import("@/models/product.model")).default;
      const directProduct = await Product.findOne({
        _id: directProductId,
        isDeleted: false,
      });

      if (!directProduct) {
        console.warn("[api/orders] POST direct item product not found", {
          userId,
          productId: directProductId,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Product not found",
            errors: [
              {
                field: "directItem.productId",
                message: "No product exists for this id",
              },
            ],
          },
          { status: 404 },
        );
      }

      sourceItems = [
        {
          product: directProduct,
          variant: {
            size:
              directItem.size != null && String(directItem.size).trim() !== ""
                ? String(directItem.size).trim()
                : null,
            color:
              directItem.color != null && String(directItem.color).trim() !== ""
                ? String(directItem.color).trim()
                : null,
          },
          quantity: directQuantity,
          customization:
            directItem.customization != null && typeof directItem.customization === "object"
              ? directItem.customization
              : null,
        },
      ];
    } else {
      const Cart = (await import("@/models/cart.model")).default;
      cart = await Cart.findOne({ user: user._id }).populate("items.product");

      if (!cart?.items?.length) {
        console.warn("[api/orders] POST empty cart", { userId });
        return NextResponse.json(
          {
            success: false,
            message: "Cart is empty",
            errors: [
              {
                field: "cart",
                message: "Your cart is empty. Add items to create an order.",
              },
            ],
          },
          { status: 400 },
        );
      }

      sourceItems = cart.items;
    }

    const shippingAddr = await Address.findOne({
      _id: shippingIdStr,
      user: user._id,
      isDeleted: false,
    });

    if (!shippingAddr) {
      console.warn("[api/orders] POST shipping address not found", {
        userId,
        shippingAddressId: shippingIdStr,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Shipping address not found",
          errors: [
            {
              field: "shippingAddressId",
              message: "No saved address found for this account",
            },
          ],
        },
        { status: 404 },
      );
    }

    let billingAddr = shippingAddr;
    if (billingAddressId != null && String(billingAddressId).trim()) {
      const bid = String(billingAddressId).trim();
      if (isStrictMongoObjectIdString(bid)) {
        const bDoc = await Address.findOne({
          _id: bid,
          user: user._id,
          isDeleted: false,
        });
        if (!bDoc) {
          return NextResponse.json(
            {
              success: false,
              message: "Billing address not found",
              errors: [
                {
                  field: "billingAddressId",
                  message: "No saved address found for this account",
                },
              ],
            },
            { status: 404 },
          );
        }
        billingAddr = bDoc;
      }
    }

    // shippingCostRaw is accepted from the client only as a display hint —
    // the authoritative cost is always recomputed here from ShippingRule.
    void shippingCostRaw;

    // Validate items and prepare order items — identical logic for both the
    // normal cart path and the Buy Now direct-item path (sourceItems has one
    // synthetic entry in the latter case).
    const orderItems = [];
    const productUpdates = [];
    const errorField = isDirect ? "directItem" : "cart";

    for (const cartItem of sourceItems) {
      const product = cartItem.product;

      if (!product || typeof product !== "object" || !product._id) {
        console.warn("[api/orders] POST line missing populated product", {
          userId,
          isDirect,
        });
        return NextResponse.json(
          {
            success: false,
            message: isDirect
              ? "The selected product is invalid"
              : "Cart contains an invalid product reference",
            errors: [
              {
                field: errorField,
                message: isDirect
                  ? "The product could not be loaded. Go back and try again."
                  : "A cart item could not be loaded. Remove it and add the product again.",
              },
            ],
          },
          { status: 400 },
        );
      }

      // Check if product exists and is available
      if (product.isDeleted || product.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: `Product "${cartItem.product?.name || "Unknown"}" is no longer available`,
            errors: [
              {
                field: errorField,
                message: `Product "${cartItem.product?.name || "Unknown"}" has been removed or is unavailable`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // Check stock availability
      let availableStock = product.stock;
      let variant = null;

      if (cartItem.variant.size || cartItem.variant.color) {
        variant = product.variants.find(
          (v) =>
            v.size === (cartItem.variant.size || null) &&
            v.color === (cartItem.variant.color || null) &&
            v.isActive !== false
        );

        if (!variant) {
          return NextResponse.json(
            {
              success: false,
              message: `Variant for "${product.name}" is no longer available`,
              errors: [
                {
                  field: errorField,
                  message: `Selected variant for "${product.name}" is no longer available`,
                },
              ],
            },
            { status: 400 }
          );
        }

        availableStock = variant.stock || 0;
      }

      if (availableStock < cartItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${product.name}"`,
            errors: [
              {
                field: errorField,
                message: `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available for "${product.name}"`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // Get product image
      const primaryImage =
        product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      // Calculate item discount
      const itemOriginalPrice = variant
        ? variant.originalPrice || product.originalPrice
        : product.originalPrice;
      const itemPrice = variant ? variant.price : product.basePrice;
      const itemDiscount =
        itemOriginalPrice && itemOriginalPrice > itemPrice
          ? itemOriginalPrice - itemPrice
          : 0;

      // Create order item
      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: primaryImage,
        variant: {
          size: cartItem.variant.size || null,
          color: cartItem.variant.color || null,
          sku: variant?.sku || null,
        },
        quantity: cartItem.quantity,
        price: itemPrice,
        originalPrice: itemOriginalPrice || null,
        discount: itemDiscount,
        total: itemPrice * cartItem.quantity,
        status: "pending",
        customization: cartItem.customization ?? null,
      });

      // Track stock updates
      if (variant) {
        variant.stock -= cartItem.quantity;
        variant.isActive = variant.stock > 0;
        
        // Also update main product stock since we bypass save hooks
        product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        product.inStock = product.stock > 0 || product.variants.some(v => v.stock > 0 && v.isActive !== false);
      } else {
        product.stock -= cartItem.quantity;
        product.inStock = product.stock > 0;
      }

      productUpdates.push(product);
    }

    // Format addresses
    const formattedShippingAddress = {
      name: shippingAddr.name,
      phone: shippingAddr.phone,
      addressLine1: shippingAddr.addressLine1,
      addressLine2: shippingAddr.addressLine2 || "",
      city: shippingAddr.city,
      state: shippingAddr.state,
      country: shippingAddr.country || "India",
      pincode: shippingAddr.pincode,
      type: shippingAddr.type || "home",
    };

    const formattedBillingAddress = {
      name: billingAddr.name,
      phone: billingAddr.phone,
      addressLine1: billingAddr.addressLine1,
      addressLine2: billingAddr.addressLine2 || "",
      city: billingAddr.city,
      state: billingAddr.state,
      country: billingAddr.country || "India",
      pincode: billingAddr.pincode,
    };

    // Buy Now never applies the user's cart coupon — it's a direct,
    // single-item purchase outside the cart.
    const cartCoupon =
      !isDirect && cart?.coupon && cart.coupon.code
        ? {
            code: cart.coupon.code,
            discount: cart.coupon.discount,
            type: cart.coupon.type,
          }
        : null;

    // Resolve the two numbers the client is never trusted for: shipping
    // (from active ShippingRule zones matching the destination) and tax
    // (from active TaxRate documents applicable to the destination state).
    const preDiscountSubtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const [shippingCostNum, taxRatePercent] = await Promise.all([
      resolveShippingCost(shippingAddr, preDiscountSubtotal),
      resolveTaxRatePercent(shippingAddr.state),
    ]);

    const pricing = computeOrderPricingFromLineItems(
      orderItems,
      cartCoupon,
      shippingCostNum,
      taxRatePercent,
    );

    const orderNumber = Order.generateOrderNumber();

    console.log("[api/orders] POST creating order", {
      userId,
      isDirect,
      sourceLineCount: sourceItems.length,
      orderLineCount: orderItems.length,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      shippingCost: shippingCostNum,
      taxRatePercent,
      tax: pricing.tax.total,
      total: pricing.total,
      orderNumber,
    });

    const orderData = {
      orderNumber,
      user: user._id,
      items: orderItems,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      tax: pricing.tax,
      shippingAddress: formattedShippingAddress,
      billingAddress: formattedBillingAddress,
      shipping: {
        method: shippingMethod,
        cost: shippingCostNum,
        estimatedDays: shippingMethod === "express" ? 1 : 3,
      },
      delivery: {
        // Set a real estimate up front from shipping.estimatedDays, instead
        // of leaving it null until an admin manually assigns a delivery
        // partner later — that's what forced the order-detail UI to fall
        // back to a client-side orderDate+3..+5 guess for most of an
        // order's life. assign-delivery still overwrites this with a
        // partner-specific date once one is assigned.
        estimatedDelivery: new Date(
          Date.now() + (shippingMethod === "express" ? 1 : 3) * 24 * 60 * 60 * 1000,
        ),
      },
      payment: {
        // paymentMethod is validated against ACTIVE_PAYMENT_METHODS above,
        // so this is always "cod" today — the status/paidAt branch is kept
        // so re-enabling other methods later only means restoring them to
        // ACTIVE_PAYMENT_METHODS, not touching this logic again.
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "processing",
        transactionId: transactionId || null,
        paymentId: paymentId || null,
        paidAt: paymentMethod === "cod" ? null : new Date(),
      },
      notes: {
        customer: notes?.customer || null,
        admin: null,
      },
    };

    if (cartCoupon) {
      orderData.coupon = {
        code: cartCoupon.code,
        discount: cartCoupon.discount,
        type: cartCoupon.type,
      };
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update product stock using updateOne to bypass save hooks
    const Product = (await import("@/models/product.model")).default;
    for (const product of productUpdates) {
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            stock: product.stock, 
            variants: product.variants, 
            inStock: product.inStock 
          } 
        }
      );
    }

    // Clear cart if requested — never applies to Buy Now, which never read
    // or touched the user's real cart in the first place.
    if (clearCart && cart) {
      await cart.clear();
    }

    // Best-effort order confirmation email — never fail order creation
    // because the customer's mailbox/SMTP hiccups.
    sendOrderConfirmationEmail(user.email, {
      customerName: `${user.firstname || ""} ${user.lastname || ""}`.trim() || "Customer",
      orderId: newOrder.orderNumber,
      orderDate: newOrder.createdAt?.toLocaleDateString?.() || new Date().toLocaleDateString(),
      totalAmount: newOrder.total,
    })
      .then((result) => {
        if (!result?.success) {
          console.error("[api/orders] Order confirmation email failed:", result?.error);
        }
      })
      .catch((err) => {
        console.error("[api/orders] Failed to send order confirmation email:", err);
      });

    // Populate order for response
    await newOrder.populate({
      path: "items.product",
      select: "name slug images",
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

    // Format order items for response
    const formattedOrderItems = newOrder.items.map((item) => {
      const product = item.product;
      const primaryImage =
        product?.images?.find((img) => img.isPrimary)?.url ||
        product?.images?.[0]?.url ||
        item.productImage ||
        null;

      return {
        id: item._id,
        product: {
          id: product?._id || null,
          name: item.productName,
          slug: product?.slug || null,
          image: primaryImage,
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
        },
        variant: {
          size: item.variant.size || null,
          color: item.variant.color || null,
          sku: item.variant.sku || null,
        },
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice || null,
        discount: item.discount || 0,
        total: item.total,
        status: item.status,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: {
          order: {
            id: newOrder._id,
            orderNumber: newOrder.orderNumber,
            items: formattedOrderItems,
            itemCount: newOrder.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            shippingAddress: newOrder.shippingAddress,
            billingAddress: newOrder.billingAddress,
            subtotal: newOrder.subtotal,
            discount: newOrder.discount,
            coupon: newOrder.coupon.code
              ? {
                  code: newOrder.coupon.code,
                  discount: newOrder.coupon.discount,
                  type: newOrder.coupon.type,
                }
              : null,
            shipping: {
              method: newOrder.shipping.method,
              cost: newOrder.shipping.cost,
              estimatedDays: newOrder.shipping.estimatedDays,
            },
            tax: {
              gst: newOrder.tax.gst || 0,
              total: newOrder.tax.total || 0,
            },
            total: newOrder.total,
            payment: {
              method: newOrder.payment.method,
              status: newOrder.payment.status,
              transactionId: newOrder.payment.transactionId || null,
              paymentId: newOrder.payment.paymentId || null,
              paidAt: newOrder.payment.paidAt || null,
            },
            status: newOrder.status,
            createdAt: newOrder.createdAt,
            updatedAt: newOrder.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

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
        message: error.message || "Failed to create order. Please try again.",
      },
      { status: 500 }
    );
  }
}


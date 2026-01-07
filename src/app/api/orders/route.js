import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";

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

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Orders retrieved successfully",
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
 * Create new order from cart
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Import required models
    const Cart = (await import("@/models/cart.model")).default;
    const Product = (await import("@/models/product.model")).default;
    const Address = (await import("@/models/address.model")).default;

    // Parse request body
    const body = await request.json();
    const {
      shippingAddressId,
      billingAddressId,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentId,
      transactionId,
      shippingMethod = "standard",
      shippingCost = 0,
      notes,
      clearCart = true,
    } = body;

    // Validate required fields
    const errors = [];

    // Validate addresses
    let shippingAddr = null;
    let billingAddr = null;

    if (shippingAddressId) {
      shippingAddr = await Address.findOne({
        _id: shippingAddressId,
        user: user._id,
        isDeleted: false,
      });

      if (!shippingAddr) {
        errors.push({
          field: "shippingAddressId",
          message: "Shipping address not found",
        });
      }
    } else if (shippingAddress) {
      // Validate shipping address object
      if (
        !shippingAddress.name ||
        !shippingAddress.phone ||
        !shippingAddress.addressLine1 ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.pincode
      ) {
        errors.push({
          field: "shippingAddress",
          message: "Shipping address is incomplete",
        });
      } else {
        shippingAddr = shippingAddress;
      }
    } else {
      errors.push({
        field: "shippingAddress",
        message: "Shipping address is required",
      });
    }

    if (billingAddressId) {
      billingAddr = await Address.findOne({
        _id: billingAddressId,
        user: user._id,
        isDeleted: false,
      });

      if (!billingAddr) {
        errors.push({
          field: "billingAddressId",
          message: "Billing address not found",
        });
      }
    } else if (billingAddress) {
      // Validate billing address object
      if (
        !billingAddress.name ||
        !billingAddress.phone ||
        !billingAddress.addressLine1 ||
        !billingAddress.city ||
        !billingAddress.state ||
        !billingAddress.pincode
      ) {
        errors.push({
          field: "billingAddress",
          message: "Billing address is incomplete",
        });
      } else {
        billingAddr = billingAddress;
      }
    } else {
      // Use shipping address as billing address if not provided
      billingAddr = shippingAddr;
    }

    // Validate payment method
    const validPaymentMethods = [
      "card",
      "upi",
      "netbanking",
      "cod",
      "razorpay",
      "stripe",
      "paypal",
    ];
    if (!paymentMethod) {
      errors.push({
        field: "paymentMethod",
        message: "Payment method is required",
      });
    } else if (!validPaymentMethods.includes(paymentMethod)) {
      errors.push({
        field: "paymentMethod",
        message: "Invalid payment method",
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

    // Get user's cart
    const cart = await Cart.findOne({ user: user._id }).populate(
      "items.product"
    );

    if (!cart || !cart.items || cart.items.length === 0) {
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
        { status: 400 }
      );
    }

    // Validate cart items and prepare order items
    const orderItems = [];
    const productUpdates = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      // Check if product exists and is available
      if (!product || product.isDeleted || product.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: `Product "${cartItem.product?.name || "Unknown"}" is no longer available`,
            errors: [
              {
                field: "cart",
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
                  field: "cart",
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
                field: "cart",
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
      });

      // Track stock updates
      if (variant) {
        variant.stock -= cartItem.quantity;
        variant.isActive = variant.stock > 0;
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

    // Create order
    const orderData = {
      user: user._id,
      items: orderItems,
      shippingAddress: formattedShippingAddress,
      billingAddress: formattedBillingAddress,
      shipping: {
        method: shippingMethod,
        cost: shippingCost,
        estimatedDays: shippingMethod === "express" ? 1 : 3,
      },
      payment: {
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

    // Add coupon if applied
    if (cart.coupon && cart.coupon.code) {
      orderData.coupon = {
        code: cart.coupon.code,
        discount: cart.coupon.discount,
        type: cart.coupon.type,
      };
    }

    // Create order (totals will be calculated by pre-save hook)
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update product stock
    for (const product of productUpdates) {
      await product.save();
    }

    // Clear cart if requested
    if (clearCart) {
      await cart.clear();
    }

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


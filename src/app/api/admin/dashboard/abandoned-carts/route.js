import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/abandoned-carts
 * Get abandoned cart statistics
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - days: Number of days since last update to consider abandoned (default: 7)
 * - minValue: Minimum cart value to include (optional)
 * - sort: Sort order - "newest" (default), "oldest", "value-desc", "value-asc"
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
    const days = parseInt(searchParams.get("days")) || 7;
    const minValue = parseFloat(searchParams.get("minValue"));
    const sort = searchParams.get("sort") || "newest";

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Build query for abandoned carts
    const query = {
      "items.0": { $exists: true }, // Has at least one item
      lastUpdated: { $lt: cutoffDate }, // Not updated in last N days
    };

    // Minimum value filter
    if (minValue !== undefined && !isNaN(minValue)) {
      // We'll filter by subtotal after aggregation
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.lastUpdated = 1;
        break;
      case "value-desc":
        // Will sort after calculating subtotal
        break;
      case "value-asc":
        // Will sort after calculating subtotal
        break;
      case "newest":
      default:
        sortObj.lastUpdated = -1;
        break;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get abandoned carts
    const carts = await Cart.find(query)
      .populate("user", "firstname lastname email phone")
      .populate({
        path: "items.product",
        select: "name slug images basePrice",
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Cart.countDocuments(query);

    // Format carts and calculate values
    const formattedCarts = carts
      .map((cart) => {
        // Calculate cart subtotal
        const subtotal = cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Calculate discount
        let discount = 0;
        if (cart.coupon && cart.coupon.code) {
          if (cart.coupon.type === "percentage") {
            discount = (subtotal * cart.coupon.discount) / 100;
          } else {
            discount = cart.coupon.discount;
          }
        }

        const total = Math.max(0, subtotal - discount);
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        // Calculate days since last update
        const daysSinceUpdate = Math.floor(
          (new Date() - new Date(cart.lastUpdated)) / (1000 * 60 * 60 * 24)
        );

        return {
          id: cart._id,
          user: cart.user
            ? {
                id: cart.user._id,
                name: `${cart.user.firstname} ${cart.user.lastname}`,
                email: cart.user.email,
                phone: cart.user.phone || null,
              }
            : null,
          items: cart.items.map((item) => {
            const product = item.product;
            const primaryImage =
              product?.images?.find((img) => img.isPrimary)?.url ||
              product?.images?.[0]?.url ||
              null;

            return {
              id: item._id,
              product: {
                id: product?._id || null,
                name: product?.name || null,
                slug: product?.slug || null,
                image: primaryImage,
              },
              variant: {
                size: item.variant.size || null,
                color: item.variant.color || null,
              },
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            };
          }),
          itemCount: itemCount,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          total: Math.round(total * 100) / 100,
          coupon: cart.coupon?.code
            ? {
                code: cart.coupon.code,
                discount: cart.coupon.discount,
                type: cart.coupon.type,
              }
            : null,
          lastUpdated: cart.lastUpdated,
          daysSinceUpdate: daysSinceUpdate,
        };
      })
      .filter((cart) => {
        // Filter by minimum value if specified
        if (minValue !== undefined && !isNaN(minValue)) {
          return cart.total >= minValue;
        }
        return true;
      });

    // Sort by value if requested
    if (sort === "value-desc") {
      formattedCarts.sort((a, b) => b.total - a.total);
    } else if (sort === "value-asc") {
      formattedCarts.sort((a, b) => a.total - b.total);
    }

    // Calculate statistics
    const totalAbandonedCarts = await Cart.countDocuments(query);
    const totalAbandonedValue = formattedCarts.reduce((sum, cart) => sum + cart.total, 0);
    const averageAbandonedValue =
      formattedCarts.length > 0 ? totalAbandonedValue / formattedCarts.length : 0;

    // Get abandoned carts by days
    const abandonedByDays = await Cart.aggregate([
      { $match: query },
      {
        $project: {
          daysSinceUpdate: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$lastUpdated"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          subtotal: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] },
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: "$daysSinceUpdate",
          boundaries: [0, 1, 3, 7, 14, 30, 60, 90],
          default: "90+",
          output: {
            count: { $sum: 1 },
            totalValue: { $sum: "$subtotal" },
          },
        },
      },
    ]);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Abandoned cart statistics retrieved successfully",
        data: {
          statistics: {
            totalAbandonedCarts: totalAbandonedCarts,
            totalAbandonedValue: Math.round(totalAbandonedValue * 100) / 100,
            averageAbandonedValue: Math.round(averageAbandonedValue * 100) / 100,
            byDays: abandonedByDays.map((item) => ({
              range: item._id,
              count: item.count,
              totalValue: Math.round(item.totalValue * 100) / 100,
            })),
          },
          carts: formattedCarts,
          pagination: {
            page,
            limit,
            total: formattedCarts.length,
            totalPages: Math.ceil(formattedCarts.length / limit),
            hasNextPage: page < Math.ceil(formattedCarts.length / limit),
            hasPrevPage: page > 1,
          },
          filters: {
            days,
            minValue: minValue || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get abandoned carts error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve abandoned cart statistics. Please try again.",
      },
      { status: 500 }
    );
  }
}


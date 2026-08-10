import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import { authenticateAdmin } from "@/lib/auth";
import { sendCartRecoveryEmail } from "@/lib/email";

/**
 * POST /api/admin/dashboard/abandoned-carts/send-recovery
 * Send cart-recovery emails for the given abandoned carts. The
 * abandoned-carts GET endpoint reports the stats/list; this is the
 * previously-missing action that actually does something about them.
 *
 * Body Parameters:
 * - cartIds: string[] (required) — Cart ObjectIds to email
 */
export async function POST(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const body = await request.json();
    const cartIds = Array.isArray(body?.cartIds) ? body.cartIds : [];

    if (cartIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "cartIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const carts = await Cart.find({ _id: { $in: cartIds } })
      .populate("user", "firstname lastname email")
      .populate({ path: "items.product", select: "name" })
      .lean();

    const results = await Promise.all(
      carts.map(async (cart) => {
        if (!cart.user?.email) {
          return { cartId: cart._id, sent: false, reason: "No email on file for this cart's user" };
        }

        const subtotal = cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        const result = await sendCartRecoveryEmail(cart.user.email, {
          customerName: cart.user.firstname
            ? `${cart.user.firstname} ${cart.user.lastname || ""}`.trim()
            : undefined,
          items: cart.items.map((item) => ({
            name: item.product?.name || "Item",
            quantity: item.quantity,
            price: item.price,
          })),
          cartTotal: Math.round(subtotal * 100) / 100,
        });

        return {
          cartId: cart._id,
          sent: !!result.success,
          reason: result.success ? null : result.message,
        };
      })
    );

    const sentCount = results.filter((r) => r.sent).length;

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${sentCount} of ${cartIds.length} recovery email(s)`,
        data: { results, sentCount, requestedCount: cartIds.length },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send abandoned cart recovery error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send recovery emails. Please try again.",
      },
      { status: 500 }
    );
  }
}

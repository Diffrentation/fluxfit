import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/cart.model";
import { sendCartRecoveryEmail } from "@/lib/email";

const ABANDONED_AFTER_DAYS = 3; // No cart activity for this long counts as abandoned
const RESEND_COOLDOWN_DAYS = 7; // Don't re-email the same cart more than once per this window
const MAX_CARTS_PER_RUN = 200; // Keep each cron invocation within a serverless time budget

/**
 * GET /api/cron/abandoned-cart-recovery
 * Scheduled (see vercel.json) automated abandoned-cart recovery emails —
 * previously this only existed as a manual "Send Recovery Emails" button
 * in the admin dashboard (POST /api/admin/dashboard/abandoned-carts/send-recovery,
 * still there for on-demand use). This is the real scheduled version.
 *
 * Protected via CRON_SECRET: Vercel Cron automatically sends
 * `Authorization: Bearer ${CRON_SECRET}` when that env var is configured on
 * the project, so this only needs to check for a match — see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, message: "CRON_SECRET is not configured" },
        { status: 500 }
      );
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const abandonedCutoff = new Date();
    abandonedCutoff.setDate(abandonedCutoff.getDate() - ABANDONED_AFTER_DAYS);
    const resendCutoff = new Date();
    resendCutoff.setDate(resendCutoff.getDate() - RESEND_COOLDOWN_DAYS);

    const carts = await Cart.find({
      "items.0": { $exists: true },
      lastUpdated: { $lt: abandonedCutoff },
      $or: [
        { recoveryEmailSentAt: null },
        { recoveryEmailSentAt: { $lt: resendCutoff } },
      ],
    })
      .populate("user", "firstname lastname email")
      .populate({ path: "items.product", select: "name" })
      .limit(MAX_CARTS_PER_RUN)
      .lean();

    let sentCount = 0;
    let skippedCount = 0;

    for (const cart of carts) {
      if (!cart.user?.email) {
        skippedCount += 1;
        continue;
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

      if (result.success) {
        sentCount += 1;
        await Cart.updateOne(
          { _id: cart._id },
          { $set: { recoveryEmailSentAt: new Date() } }
        );
      } else {
        skippedCount += 1;
        console.error(
          `Abandoned-cart recovery email failed for cart ${cart._id}:`,
          result.message
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${sentCount} recovery email(s), skipped ${skippedCount}`,
        data: { matched: carts.length, sentCount, skippedCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Abandoned cart recovery cron error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to run abandoned cart recovery",
      },
      { status: 500 }
    );
  }
}

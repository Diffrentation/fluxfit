import { NextResponse } from "next/server";
import { ACTIVE_PAYMENT_METHODS, PAYMENT_METHOD_CATALOG } from "@/lib/paymentMethods";

/**
 * GET /api/payments/methods
 * Get available payment methods
 *
 * Returns list of payment methods with an `enabled` flag reflecting
 * ACTIVE_PAYMENT_METHODS — the same list src/app/api/orders/route.js
 * validates paymentMethod against, so this can't drift out of sync with
 * what checkout will actually accept.
 */
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") || "INR";

    const paymentMethods = PAYMENT_METHOD_CATALOG.map((method) => ({
      ...method,
      enabled: ACTIVE_PAYMENT_METHODS.includes(method.id),
    }));

    // Filter by currency if specified
    const filteredMethods = paymentMethods.filter((method) =>
      method.currencies.includes(currency)
    );

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Payment methods retrieved successfully",
        data: {
          methods: filteredMethods,
          currency: currency,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to retrieve payment methods. Please try again.",
      },
      { status: 500 }
    );
  }
}

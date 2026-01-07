import { NextResponse } from "next/server";

/**
 * GET /api/payments/methods
 * Get available payment methods
 *
 * Returns list of available payment methods with their details.
 */
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") || "INR";

    // Define available payment methods
    const paymentMethods = [
      {
        id: "razorpay",
        name: "Razorpay",
        displayName: "Credit/Debit Card, UPI, Net Banking",
        type: "gateway",
        enabled: true,
        methods: ["card", "upi", "netbanking", "wallet"],
        currencies: ["INR"],
        icon: "💳",
        description: "Secure payment via Razorpay",
        minAmount: 1, // Minimum amount in rupees
        maxAmount: null, // No maximum
      },
      {
        id: "cod",
        name: "Cash on Delivery",
        displayName: "Cash on Delivery",
        type: "cod",
        enabled: true,
        methods: ["cod"],
        currencies: ["INR"],
        icon: "💰",
        description: "Pay when you receive your order",
        minAmount: 0,
        maxAmount: 5000, // Maximum COD amount
      },
    ];

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

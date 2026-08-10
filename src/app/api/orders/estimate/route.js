import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Address from "@/models/address.model";
import { authenticateUser } from "@/lib/auth";
import { resolveShippingCost, resolveTaxRatePercent } from "@/lib/pricing";

/**
 * POST /api/orders/estimate
 * Pre-order shipping/tax estimate for cart & checkout — reuses the exact
 * same ShippingRule/TaxRate resolution logic that order creation uses
 * server-side, so what's previewed matches what will actually be charged
 * once a real order is placed (order creation still independently
 * recomputes everything from scratch; this is display-only).
 *
 * Body Parameters:
 * - orderValue: number (required) — pre-shipping/tax order subtotal
 * - addressId: string — a saved address ID belonging to the caller
 * - address: { state, city, pincode } — used if addressId isn't provided
 *   (e.g. an address not yet saved)
 *
 * One of addressId/address is required.
 */
export async function POST(request) {
  try {
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    await connectDB();

    const body = await request.json();
    const { addressId, address, orderValue } = body;

    const value = Number(orderValue);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { success: false, message: "orderValue must be a non-negative number" },
        { status: 400 }
      );
    }

    let destination = null;

    if (addressId) {
      const addr = await Address.findOne({
        _id: addressId,
        user: user._id,
        isDeleted: false,
      }).lean();
      if (!addr) {
        return NextResponse.json(
          { success: false, message: "Address not found" },
          { status: 404 }
        );
      }
      destination = { state: addr.state, city: addr.city, pincode: addr.pincode };
    } else if (address?.state) {
      destination = {
        state: address.state,
        city: address.city || "",
        pincode: address.pincode || "",
      };
    } else {
      return NextResponse.json(
        { success: false, message: "Provide either addressId or address.state" },
        { status: 400 }
      );
    }

    const [shippingCost, taxRatePercent] = await Promise.all([
      resolveShippingCost(destination, value),
      resolveTaxRatePercent(destination.state),
    ]);

    const taxAmount = Math.round(((value * taxRatePercent) / 100) * 100) / 100;
    const total = Math.round((value + shippingCost + taxAmount) * 100) / 100;

    return NextResponse.json(
      {
        success: true,
        message: "Estimate calculated successfully",
        data: {
          orderValue: value,
          shippingCost: Math.round(shippingCost * 100) / 100,
          taxRatePercent,
          taxAmount,
          total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Order estimate error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to calculate estimate. Please try again.",
      },
      { status: 500 }
    );
  }
}

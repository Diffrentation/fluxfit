import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/settings.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/currency-tax
 * Get currency and tax settings
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

    // Get settings (singleton pattern)
    const settings = await Settings.getSettings();

    // Format currency and tax settings
    const currencyTaxSettings = {
      currency: {
        code: settings.currency?.code || "INR",
        symbol: settings.currency?.symbol || "₹",
        position: settings.currency?.position || "before",
      },
      tax: {
        enabled: settings.tax?.enabled !== undefined ? settings.tax.enabled : true,
        defaultRate: settings.tax?.defaultRate || 18,
        inclusive: settings.tax?.inclusive !== undefined ? settings.tax.inclusive : false,
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Currency and tax settings retrieved successfully",
        data: {
          settings: currencyTaxSettings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get currency and tax settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve currency and tax settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/currency-tax
 * Update currency and tax settings
 * 
 * Body Parameters (all optional):
 * - currency: Currency object { code, symbol, position }
 *   - code: Currency code (e.g., "INR", "USD", "EUR")
 *   - symbol: Currency symbol (e.g., "₹", "$", "€")
 *   - position: Symbol position - "before" or "after"
 * - tax: Tax object { enabled, defaultRate, inclusive }
 *   - enabled: Enable/disable tax (boolean)
 *   - defaultRate: Default tax rate percentage (number, 0-100)
 *   - inclusive: Tax inclusive pricing (boolean)
 */
export async function PUT(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get body
    const body = await request.json();
    const { currency, tax } = body;

    // Validate currency if provided
    if (currency) {
      if (currency.code !== undefined && (!currency.code || typeof currency.code !== "string")) {
        return NextResponse.json(
          {
            success: false,
            message: "Currency code is required and must be a string",
            errors: [{ field: "currency.code", message: "Currency code is required" }],
          },
          { status: 400 }
        );
      }

      if (currency.symbol !== undefined && (!currency.symbol || typeof currency.symbol !== "string")) {
        return NextResponse.json(
          {
            success: false,
            message: "Currency symbol is required and must be a string",
            errors: [{ field: "currency.symbol", message: "Currency symbol is required" }],
          },
          { status: 400 }
        );
      }

      if (currency.position !== undefined) {
        const validPositions = ["before", "after"];
        if (!validPositions.includes(currency.position)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid currency position. Must be one of: ${validPositions.join(", ")}`,
              errors: [
                {
                  field: "currency.position",
                  message: `Position must be one of: ${validPositions.join(", ")}`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate tax if provided
    if (tax) {
      if (tax.enabled !== undefined && typeof tax.enabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "Tax enabled must be a boolean",
            errors: [{ field: "tax.enabled", message: "Tax enabled must be true or false" }],
          },
          { status: 400 }
        );
      }

      if (tax.defaultRate !== undefined) {
        const rate = parseFloat(tax.defaultRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return NextResponse.json(
            {
              success: false,
              message: "Tax default rate must be a number between 0 and 100",
              errors: [
                {
                  field: "tax.defaultRate",
                  message: "Tax rate must be a number between 0 and 100",
                },
              ],
            },
            { status: 400 }
          );
        }
      }

      if (tax.inclusive !== undefined && typeof tax.inclusive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "Tax inclusive must be a boolean",
            errors: [{ field: "tax.inclusive", message: "Tax inclusive must be true or false" }],
          },
          { status: 400 }
        );
      }
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Build update object
    const updates = {};

    // Update currency if provided
    if (currency) {
      updates.currency = {
        ...settings.currency,
        ...(currency.code !== undefined && { code: currency.code.trim().toUpperCase() }),
        ...(currency.symbol !== undefined && { symbol: currency.symbol.trim() }),
        ...(currency.position !== undefined && { position: currency.position }),
      };
    }

    // Update tax if provided
    if (tax) {
      updates.tax = {
        ...settings.tax,
        ...(tax.enabled !== undefined && { enabled: tax.enabled }),
        ...(tax.defaultRate !== undefined && { defaultRate: parseFloat(tax.defaultRate) }),
        ...(tax.inclusive !== undefined && { inclusive: tax.inclusive }),
      };
    }

    // Update settings
    const updatedSettings = await Settings.updateSettings(updates);

    // Format updated currency and tax settings
    const currencyTaxSettings = {
      currency: {
        code: updatedSettings.currency?.code || "INR",
        symbol: updatedSettings.currency?.symbol || "₹",
        position: updatedSettings.currency?.position || "before",
      },
      tax: {
        enabled: updatedSettings.tax?.enabled !== undefined ? updatedSettings.tax.enabled : true,
        defaultRate: updatedSettings.tax?.defaultRate || 18,
        inclusive: updatedSettings.tax?.inclusive !== undefined ? updatedSettings.tax.inclusive : false,
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Currency and tax settings updated successfully",
        data: {
          settings: currencyTaxSettings,
          updatedBy: {
            id: user._id,
            email: user.email,
          },
          updatedAt: updatedSettings.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update currency and tax settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update currency and tax settings. Please try again.",
      },
      { status: 500 }
    );
  }
}


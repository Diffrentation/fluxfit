import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/settings.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/shipping
 * Get shipping settings
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

    // Format shipping settings
    const shippingSettings = {
      freeShippingThreshold: settings.shipping?.freeShippingThreshold || 4150,
      defaultMethod: settings.shipping?.defaultMethod || "standard",
      defaultDays: settings.shipping?.defaultDays || 3,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Shipping settings retrieved successfully",
        data: {
          settings: shippingSettings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get shipping settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to retrieve shipping settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/shipping
 * Update shipping settings
 *
 * Body Parameters (all optional):
 * - freeShippingThreshold: Minimum order value for free shipping (number, min: 0)
 * - defaultMethod: Default shipping method (string)
 * - defaultDays: Default estimated delivery days (number, min: 1)
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
    const { freeShippingThreshold, defaultMethod, defaultDays } = body;

    // Validate freeShippingThreshold if provided
    if (freeShippingThreshold !== undefined) {
      const threshold = parseFloat(freeShippingThreshold);
      if (isNaN(threshold) || threshold < 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Free shipping threshold must be a number greater than or equal to 0",
            errors: [
              {
                field: "freeShippingThreshold",
                message: "Free shipping threshold must be a number >= 0",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate defaultDays if provided
    if (defaultDays !== undefined) {
      const days = parseInt(defaultDays);
      if (isNaN(days) || days < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Default days must be a number greater than or equal to 1",
            errors: [
              {
                field: "defaultDays",
                message: "Default days must be a number >= 1",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Build update object
    const updates = {
      shipping: {
        ...settings.shipping,
        ...(freeShippingThreshold !== undefined && {
          freeShippingThreshold: parseFloat(freeShippingThreshold),
        }),
        ...(defaultMethod !== undefined && {
          defaultMethod: defaultMethod.trim(),
        }),
        ...(defaultDays !== undefined && {
          defaultDays: parseInt(defaultDays),
        }),
      },
    };

    // Update settings
    const updatedSettings = await Settings.updateSettings(updates);

    // Format updated shipping settings
    const shippingSettings = {
      freeShippingThreshold:
        updatedSettings.shipping?.freeShippingThreshold || 4150,
      defaultMethod: updatedSettings.shipping?.defaultMethod || "standard",
      defaultDays: updatedSettings.shipping?.defaultDays || 3,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Shipping settings updated successfully",
        data: {
          settings: shippingSettings,
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
    console.error("Update shipping settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update shipping settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

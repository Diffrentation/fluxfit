import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/settings.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/maintenance
 * Get maintenance mode status
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

    // Format maintenance settings
    const maintenanceSettings = {
      enabled: settings.maintenance?.enabled !== undefined ? settings.maintenance.enabled : false,
      message: settings.maintenance?.message || "We are currently under maintenance. Please check back later.",
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Maintenance mode status retrieved successfully",
        data: {
          settings: maintenanceSettings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get maintenance mode status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve maintenance mode status. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/maintenance
 * Update maintenance mode
 * 
 * Body Parameters (all optional):
 * - enabled: Enable/disable maintenance mode (boolean)
 * - message: Maintenance message (string)
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
    const { enabled, message } = body;

    // Validate enabled if provided
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Enabled must be a boolean",
          errors: [
            {
              field: "enabled",
              message: "Enabled must be true or false",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate message if provided
    if (message !== undefined) {
      if (!message || !message.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Maintenance message cannot be empty",
            errors: [
              {
                field: "message",
                message: "Maintenance message is required",
              },
            ],
          },
          { status: 400 }
        );
      }

      if (message.length > 500) {
        return NextResponse.json(
          {
            success: false,
            message: "Maintenance message cannot exceed 500 characters",
            errors: [
              {
                field: "message",
                message: "Maintenance message must be 500 characters or less",
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
      maintenance: {
        ...settings.maintenance,
        ...(enabled !== undefined && { enabled: enabled }),
        ...(message !== undefined && { message: message.trim() }),
      },
    };

    // Update settings
    const updatedSettings = await Settings.updateSettings(updates);

    // Format updated maintenance settings
    const maintenanceSettings = {
      enabled: updatedSettings.maintenance?.enabled !== undefined ? updatedSettings.maintenance.enabled : false,
      message: updatedSettings.maintenance?.message || "We are currently under maintenance. Please check back later.",
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Maintenance mode updated successfully",
        data: {
          settings: maintenanceSettings,
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
    console.error("Update maintenance mode error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update maintenance mode. Please try again.",
      },
      { status: 500 }
    );
  }
}


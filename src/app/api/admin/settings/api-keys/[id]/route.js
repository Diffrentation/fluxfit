import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import APIKey from "@/models/apikey.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/settings/api-keys/:id
 * Update API key
 *
 * Body Parameters (all optional):
 * - name: API key name
 * - type: API key type - "public", "private", "webhook"
 * - permissions: Array of permissions
 * - rateLimit: Rate limit object { requests, period }
 * - expiresAt: Expiration date (ISO format)
 * - allowedIPs: Array of allowed IP addresses
 * - webhookUrl: Webhook URL (required if type is "webhook")
 * - isActive: Active status
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get API key ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API key ID",
          errors: [{ field: "id", message: "Valid API key ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = await APIKey.findById(id);
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "API key not found",
        },
        { status: 404 }
      );
    }

    // Get body
    const body = await request.json();
    const {
      name,
      type,
      permissions,
      rateLimit,
      expiresAt,
      allowedIPs,
      webhookUrl,
      isActive,
    } = body;

    // Update name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "API key name cannot be empty",
            errors: [{ field: "name", message: "API key name is required" }],
          },
          { status: 400 }
        );
      }
      apiKey.name = name.trim();
    }

    // Update type if provided
    if (type !== undefined) {
      const validTypes = ["public", "private", "webhook"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid API key type. Must be one of: ${validTypes.join(
              ", "
            )}`,
            errors: [
              {
                field: "type",
                message: `API key type must be one of: ${validTypes.join(
                  ", "
                )}`,
              },
            ],
          },
          { status: 400 }
        );
      }

      // If changing to webhook type, validate webhook URL
      if (type === "webhook") {
        const urlToCheck =
          webhookUrl !== undefined ? webhookUrl : apiKey.webhookUrl;
        if (!urlToCheck || !urlToCheck.trim()) {
          return NextResponse.json(
            {
              success: false,
              message: "Webhook URL is required for webhook type API keys",
              errors: [
                {
                  field: "webhookUrl",
                  message: "Webhook URL is required",
                },
              ],
            },
            { status: 400 }
          );
        }
      }

      apiKey.type = type;
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      if (Array.isArray(permissions)) {
        const validPermissions = [
          "read",
          "write",
          "delete",
          "admin",
          "products",
          "orders",
          "payments",
          "users",
        ];
        for (const perm of permissions) {
          if (!validPermissions.includes(perm)) {
            return NextResponse.json(
              {
                success: false,
                message: `Invalid permission: ${perm}`,
                errors: [
                  {
                    field: "permissions",
                    message: `Permission must be one of: ${validPermissions.join(
                      ", "
                    )}`,
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
        apiKey.permissions = permissions;
      } else {
        apiKey.permissions = [];
      }
    }

    // Update rate limit if provided
    if (rateLimit !== undefined) {
      if (rateLimit.requests !== undefined) {
        const requests = parseInt(rateLimit.requests);
        if (isNaN(requests) || requests < 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Rate limit requests must be a number >= 1",
              errors: [
                {
                  field: "rateLimit.requests",
                  message: "Rate limit requests must be a number >= 1",
                },
              ],
            },
            { status: 400 }
          );
        }
        apiKey.rateLimit.requests = requests;
      }

      if (rateLimit.period !== undefined) {
        const validPeriods = ["minute", "hour", "day"];
        if (!validPeriods.includes(rateLimit.period)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid rate limit period. Must be one of: ${validPeriods.join(
                ", "
              )}`,
              errors: [
                {
                  field: "rateLimit.period",
                  message: `Rate limit period must be one of: ${validPeriods.join(
                    ", "
                  )}`,
                },
              ],
            },
            { status: 400 }
          );
        }
        apiKey.rateLimit.period = rateLimit.period;
      }
    }

    // Update expiresAt if provided
    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        apiKey.expiresAt = null;
      } else {
        const expiryDate = new Date(expiresAt);
        if (isNaN(expiryDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid expiration date format",
              errors: [
                {
                  field: "expiresAt",
                  message: "Expiration date must be a valid ISO date string",
                },
              ],
            },
            { status: 400 }
          );
        }

        if (expiryDate <= new Date()) {
          return NextResponse.json(
            {
              success: false,
              message: "Expiration date must be in the future",
              errors: [
                {
                  field: "expiresAt",
                  message: "Expiration date must be in the future",
                },
              ],
            },
            { status: 400 }
          );
        }
        apiKey.expiresAt = expiryDate;
      }
    }

    // Update allowedIPs if provided
    if (allowedIPs !== undefined) {
      if (Array.isArray(allowedIPs)) {
        const ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        for (const ip of allowedIPs) {
          if (!ipRegex.test(ip.trim())) {
            return NextResponse.json(
              {
                success: false,
                message: `Invalid IP address: ${ip}`,
                errors: [
                  {
                    field: "allowedIPs",
                    message: "All IP addresses must be valid IPv4 addresses",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
        apiKey.allowedIPs = allowedIPs.map((ip) => ip.trim());
      } else {
        apiKey.allowedIPs = [];
      }
    }

    // Update webhookUrl if provided
    if (webhookUrl !== undefined) {
      if (webhookUrl === null) {
        // Allow clearing webhook URL if type is not webhook
        if (apiKey.type === "webhook") {
          return NextResponse.json(
            {
              success: false,
              message:
                "Webhook URL cannot be cleared for webhook type API keys",
              errors: [
                {
                  field: "webhookUrl",
                  message: "Webhook URL is required for webhook type",
                },
              ],
            },
            { status: 400 }
          );
        }
        apiKey.webhookUrl = null;
      } else {
        if (!webhookUrl.trim()) {
          return NextResponse.json(
            {
              success: false,
              message: "Webhook URL cannot be empty",
              errors: [
                {
                  field: "webhookUrl",
                  message: "Webhook URL cannot be empty",
                },
              ],
            },
            { status: 400 }
          );
        }

        if (!/^https?:\/\/.+/.test(webhookUrl)) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid webhook URL format",
              errors: [
                {
                  field: "webhookUrl",
                  message: "Webhook URL must be a valid HTTP/HTTPS URL",
                },
              ],
            },
            { status: 400 }
          );
        }
        apiKey.webhookUrl = webhookUrl.trim();
      }
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be a boolean",
            errors: [
              {
                field: "isActive",
                message: "isActive must be true or false",
              },
            ],
          },
          { status: 400 }
        );
      }
      apiKey.isActive = isActive;
    }

    // Save API key
    await apiKey.save();

    // Helper function to mask API key/secret
    const maskKey = (key, showFirst = 8, showLast = 4) => {
      if (!key || key.length <= showFirst + showLast) {
        return "****";
      }
      const first = key.substring(0, showFirst);
      const last = key.substring(key.length - showLast);
      const middle = "*".repeat(Math.max(4, key.length - showFirst - showLast));
      return `${first}${middle}${last}`;
    };

    // Format API key (masked)
    const apiKeyExpiresAt = apiKey.expiresAt;
    const isValid =
      apiKey.isActive &&
      (!apiKeyExpiresAt || new Date() < new Date(apiKeyExpiresAt));

    const formattedKey = {
      id: apiKey._id,
      name: apiKey.name,
      key: maskKey(apiKey.key),
      secret: maskKey(apiKey.secret),
      type: apiKey.type,
      permissions: apiKey.permissions || [],
      rateLimit: {
        requests: apiKey.rateLimit.requests,
        period: apiKey.rateLimit.period,
      },
      usage: {
        count: apiKey.usage?.count || 0,
        lastUsed: apiKey.usage?.lastUsed || null,
      },
      expiresAt: apiKeyExpiresAt || null,
      isValid: isValid,
      isActive: apiKey.isActive,
      allowedIPs: apiKey.allowedIPs || [],
      webhookUrl: apiKey.webhookUrl || null,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "API key updated successfully",
        data: {
          apiKey: formattedKey,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update API key. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/api-keys/:id
 * Delete API key
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get API key ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API key ID",
          errors: [{ field: "id", message: "Valid API key ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = await APIKey.findById(id);
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "API key not found",
        },
        { status: 404 }
      );
    }

    // Store API key info before deletion
    const apiKeyInfo = {
      id: apiKey._id,
      name: apiKey.name,
      type: apiKey.type,
      usage: {
        count: apiKey.usage?.count || 0,
        lastUsed: apiKey.usage?.lastUsed || null,
      },
    };

    // Delete API key
    await APIKey.findByIdAndDelete(id);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "API key deleted successfully",
        data: {
          deletedApiKey: apiKeyInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete API key. Please try again.",
      },
      { status: 500 }
    );
  }
}

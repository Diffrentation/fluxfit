import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import APIKey from "@/models/apikey.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/api-keys
 * Get API keys (masked)
 * 
 * Query Parameters:
 * - isActive: Filter by active status - "true", "false" (optional)
 * - type: Filter by API key type - "public", "private", "webhook" (optional)
 * - sort: Sort order - "newest" (default), "oldest", "name-asc", "name-desc", "type"
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
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    if (type) {
      const validTypes = ["public", "private", "webhook"];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "name-asc":
        sortObj.name = 1;
        break;
      case "name-desc":
        sortObj.name = -1;
        break;
      case "type":
        sortObj.type = 1;
        sortObj.name = 1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Get API keys
    const apiKeys = await APIKey.find(query).sort(sortObj).lean();

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

    // Format API keys (masked)
    const formattedKeys = apiKeys.map((apiKey) => {
      const expiresAt = apiKey.expiresAt;
      const isValid = apiKey.isActive && (!expiresAt || new Date() < new Date(expiresAt));

      return {
        id: apiKey._id,
        name: apiKey.name,
        key: maskKey(apiKey.key),
        secret: maskKey(apiKey.secret),
        type: apiKey.type,
        permissions: apiKey.permissions || [],
        rateLimit: {
          requests: apiKey.rateLimit?.requests || 100,
          period: apiKey.rateLimit?.period || "minute",
        },
        usage: {
          count: apiKey.usage?.count || 0,
          lastUsed: apiKey.usage?.lastUsed || null,
        },
        expiresAt: expiresAt || null,
        isValid: isValid,
        isActive: apiKey.isActive,
        allowedIPs: apiKey.allowedIPs || [],
        webhookUrl: apiKey.webhookUrl || null,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      };
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "API keys retrieved successfully",
        data: {
          apiKeys: formattedKeys,
          count: formattedKeys.length,
          filters: {
            isActive: isActive || null,
            type: type || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve API keys. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/api-keys
 * Create API key
 * 
 * Body Parameters:
 * - name: API key name (required)
 * - type: API key type - "public", "private", "webhook" (default: "public")
 * - permissions: Array of permissions (optional)
 * - rateLimit: Rate limit object (optional)
 *   - requests: Number of requests (default: 100)
 *   - period: Period - "minute", "hour", "day" (default: "minute")
 * - expiresAt: Expiration date (ISO format, optional)
 * - allowedIPs: Array of allowed IP addresses (optional)
 * - webhookUrl: Webhook URL (required if type is "webhook")
 * - isActive: Active status (default: true)
 */
export async function POST(request) {
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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "API key name is required",
          errors: [{ field: "name", message: "API key name is required" }],
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["public", "private", "webhook"];
    const keyType = type || "public";
    if (!validTypes.includes(keyType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid API key type. Must be one of: ${validTypes.join(", ")}`,
          errors: [
            {
              field: "type",
              message: `API key type must be one of: ${validTypes.join(", ")}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate webhook URL if type is webhook
    if (keyType === "webhook") {
      if (!webhookUrl || !webhookUrl.trim()) {
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
    }

    // Validate permissions if provided
    if (permissions !== undefined && Array.isArray(permissions)) {
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
                  message: `Permission must be one of: ${validPermissions.join(", ")}`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate rate limit if provided
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
      }

      if (rateLimit.period !== undefined) {
        const validPeriods = ["minute", "hour", "day"];
        if (!validPeriods.includes(rateLimit.period)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid rate limit period. Must be one of: ${validPeriods.join(", ")}`,
              errors: [
                {
                  field: "rateLimit.period",
                  message: `Rate limit period must be one of: ${validPeriods.join(", ")}`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate expiresAt if provided
    if (expiresAt !== undefined && expiresAt !== null) {
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
    }

    // Validate allowedIPs if provided
    if (allowedIPs !== undefined && Array.isArray(allowedIPs)) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
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
    }

    // Generate API key using static method
    const generatedKey = APIKey.generate(name.trim(), keyType, permissions || []);

    // Create API key
    const apiKeyData = {
      name: generatedKey.name,
      key: generatedKey.key,
      secret: generatedKey.secret,
      type: generatedKey.type,
      permissions: generatedKey.permissions,
      rateLimit: {
        requests: rateLimit?.requests ? parseInt(rateLimit.requests) : 100,
        period: rateLimit?.period || "minute",
      },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      allowedIPs: allowedIPs ? allowedIPs.map((ip) => ip.trim()) : [],
      webhookUrl: webhookUrl ? webhookUrl.trim() : null,
      isActive: isActive !== undefined ? isActive : true,
    };

    const apiKey = await APIKey.create(apiKeyData);

    // Format API key (show full key and secret only on creation)
    const formattedKey = {
      id: apiKey._id,
      name: apiKey.name,
      key: apiKey.key, // Show full key only on creation
      secret: apiKey.secret, // Show full secret only on creation
      type: apiKey.type,
      permissions: apiKey.permissions || [],
      rateLimit: {
        requests: apiKey.rateLimit.requests,
        period: apiKey.rateLimit.period,
      },
      expiresAt: apiKey.expiresAt || null,
      isValid: apiKey.isActive && (!apiKey.expiresAt || new Date() < apiKey.expiresAt),
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
        message: "API key created successfully. Please save the key and secret securely. They will not be shown again.",
        data: {
          apiKey: formattedKey,
          warning: "This is the only time the full API key and secret will be displayed. Please save them securely.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create API key error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "API key already exists",
          errors: [
            {
              field: "key",
              message: "An API key with this identifier already exists",
            },
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create API key. Please try again.",
      },
      { status: 500 }
    );
  }
}


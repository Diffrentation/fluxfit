import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import APIKey from "@/models/apikey.model";
import { authenticateAdmin } from "@/lib/auth";

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || null;
}

/**
 * Authenticate a request via the `x-api-key` (+ `x-api-secret` for
 * private/webhook keys) headers against the APIKey collection managed at
 * Admin Settings > API Keys. That CRUD UI previously had no route that
 * actually checked the header it issues — this is the missing other half.
 *
 * @param {Request} request
 * @param {Object} [options]
 * @param {string} [options.permission] - Permission the key must carry
 *   (e.g. "read", "orders") — checked against APIKey.permissions.
 * @returns {Promise<{error: NextResponse|null, apiKey: object|null}>}
 */
export async function authenticateApiKey(request, { permission } = {}) {
  try {
    const key = request.headers.get("x-api-key");
    if (!key) {
      return {
        error: NextResponse.json(
          { success: false, message: "Missing x-api-key header" },
          { status: 401 }
        ),
        apiKey: null,
      };
    }

    await connectDB();
    const apiKey = await APIKey.findOne({ key });

    if (!apiKey) {
      return {
        error: NextResponse.json(
          { success: false, message: "Invalid API key" },
          { status: 401 }
        ),
        apiKey: null,
      };
    }

    if (!apiKey.isValid) {
      return {
        error: NextResponse.json(
          { success: false, message: "API key is inactive or has expired" },
          { status: 401 }
        ),
        apiKey: null,
      };
    }

    // Private/webhook keys are meant to be held server-side, so also require
    // the paired secret — public keys are safe to use with just the key.
    if (apiKey.type !== "public") {
      const secret = request.headers.get("x-api-secret");
      if (!secret || secret !== apiKey.secret) {
        return {
          error: NextResponse.json(
            { success: false, message: "Missing or invalid x-api-secret header" },
            { status: 401 }
          ),
          apiKey: null,
        };
      }
    }

    const clientIp = getClientIp(request);
    if (clientIp && !apiKey.validateIP(clientIp)) {
      return {
        error: NextResponse.json(
          { success: false, message: "Request IP is not on this key's allowlist" },
          { status: 403 }
        ),
        apiKey: null,
      };
    }

    const rateLimit = await apiKey.consumeRateLimit();
    if (!rateLimit.allowed) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Rate limit exceeded (${apiKey.rateLimit.requests} requests per ${apiKey.rateLimit.period})`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))),
              "X-RateLimit-Limit": String(apiKey.rateLimit.requests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
            },
          }
        ),
        apiKey: null,
      };
    }

    if (permission && !apiKey.permissions.includes(permission) && !apiKey.permissions.includes("admin")) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `This API key does not have the "${permission}" permission`,
          },
          { status: 403 }
        ),
        apiKey: null,
      };
    }

    // Usage tracking is best-effort — failing to record it shouldn't fail the request.
    apiKey.incrementUsage().catch((err) =>
      console.error("Failed to record API key usage:", err)
    );

    return { error: null, apiKey };
  } catch (error) {
    console.error("API key authentication error:", error);
    return {
      error: NextResponse.json(
        { success: false, message: "API key authentication failed" },
        { status: 500 }
      ),
      apiKey: null,
    };
  }
}

/**
 * Accepts either a logged-in admin session (Bearer token) or a valid API key
 * with the given permission — lets external integrations (BI tools, scripts)
 * pull data via a scoped API key instead of needing an admin's JWT.
 *
 * @param {Request} request
 * @param {Object} [options]
 * @param {string} [options.permission] - Permission required when falling
 *   back to API-key auth.
 */
export async function authenticateAdminOrApiKey(request, { permission } = {}) {
  if (request.headers.get("x-api-key")) {
    const { error, apiKey } = await authenticateApiKey(request, { permission });
    if (error) return { error, user: null, apiKey: null };
    return { error: null, user: null, apiKey };
  }

  const { error, user } = await authenticateAdmin(request);
  return { error, user, apiKey: null };
}

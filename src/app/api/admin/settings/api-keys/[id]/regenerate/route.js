import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import APIKey from "@/models/apikey.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import crypto from "crypto";

/**
 * POST /api/admin/settings/api-keys/:id/regenerate
 * Regenerate API key and secret
 * 
 * This endpoint generates new key and secret for an existing API key.
 * The old key/secret will be invalidated immediately.
 * 
 * Response includes the new key and secret (unmasked) - store them securely!
 */
export async function POST(request, { params }) {
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

    // Store old key info for logging
    const oldKeyInfo = {
      name: apiKey.name,
      type: apiKey.type,
      oldKey: apiKey.key,
      oldSecret: apiKey.secret,
    };

    // Generate new key and secret
    // Using the same format as the static generate method
    const newKey = `pk_${crypto.randomBytes(32).toString("hex")}`;
    const newSecret = `sk_${crypto.randomBytes(32).toString("hex")}`;

    // Check if new key already exists (extremely unlikely, but safety check)
    const existingKey = await APIKey.findOne({ key: newKey });
    if (existingKey) {
      // Retry once with new random bytes
      const retryKey = `pk_${crypto.randomBytes(32).toString("hex")}`;
      const retrySecret = `sk_${crypto.randomBytes(32).toString("hex")}`;
      
      const retryExisting = await APIKey.findOne({ key: retryKey });
      if (retryExisting) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to generate unique API key. Please try again.",
          },
          { status: 500 }
        );
      }
      
      apiKey.key = retryKey;
      apiKey.secret = retrySecret;
    } else {
      apiKey.key = newKey;
      apiKey.secret = newSecret;
    }

    // Reset usage count (optional - you may want to keep it)
    // apiKey.usage.count = 0;
    // apiKey.usage.lastUsed = null;

    // Save the updated API key
    await apiKey.save();

    // Calculate validity
    const expiresAt = apiKey.expiresAt;
    const isValid = apiKey.isActive && (!expiresAt || new Date() < new Date(expiresAt));

    // Format response
    // IMPORTANT: Return unmasked key and secret since this is a regeneration
    // The client must store these securely immediately
    const formattedKey = {
      id: apiKey._id,
      name: apiKey.name,
      key: apiKey.key, // Unmasked - new key
      secret: apiKey.secret, // Unmasked - new secret
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
      expiresAt: expiresAt || null,
      isValid: isValid,
      isActive: apiKey.isActive,
      allowedIPs: apiKey.allowedIPs || [],
      webhookUrl: apiKey.webhookUrl || null,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      regeneratedAt: new Date(),
    };

    // Return response with new credentials
    return NextResponse.json(
      {
        success: true,
        message: "API key and secret regenerated successfully. Store the new credentials securely - they will not be shown again!",
        data: {
          apiKey: formattedKey,
          warning: "The old API key and secret have been invalidated. Update your applications with the new credentials immediately.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Regenerate API key error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to regenerate API key. Please try again.",
      },
      { status: 500 }
    );
  }
}


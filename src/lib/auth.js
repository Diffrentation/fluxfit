import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import jwt from "jsonwebtoken";

/**
 * Helper function to authenticate user from JWT token
 * Can be used across all protected API routes
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<{error: NextResponse|null, user: User|null}>} - Returns error response or authenticated user
 */
export async function authenticateUser(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Authentication required. Please provide a valid token.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token signature and expiry (stateless — no DB lookup needed for this)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    // Never accept refresh tokens as Bearer access tokens
    if (decoded.type === "refresh") {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Invalid token type.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Connect to database
    await connectDB();

    // Find user by ID only — JWT signature already proves authenticity.
    // We no longer match token field in DB to avoid race conditions during refresh rotation.
    const user = await User.findOne({
      _id: decoded.userId,
      isdeleted: false,
    });

    if (!user) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "User not found. Please login again.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Check if user is blocked
    if (user.isblocked) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Account is blocked. Please contact support.",
          },
          { status: 403 }
        ),
        user: null,
      };
    }

    return { error: null, user };
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Invalid or expired token. Please login again.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Authentication failed. Please try again.",
        },
        { status: 500 }
      ),
      user: null,
    };
  }
}

/**
 * Helper function to authenticate user and require password field
 * Useful for password-related operations
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<{error: NextResponse|null, user: User|null}>} - Returns error response or authenticated user with password field
 */
export async function authenticateUserWithPassword(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Authentication required. Please provide a valid token.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    if (decoded.type === "refresh") {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Invalid token type.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Connect to database
    await connectDB();

    // Find user by ID only — JWT signature already proves authenticity.
    // Need to select password field for comparison
    const user = await User.findOne({
      _id: decoded.userId,
      isdeleted: false,
    }).select("+password");

    if (!user) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Invalid or expired token. Please login again.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    // Check if user is blocked
    if (user.isblocked) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Account is blocked. Please contact support.",
          },
          { status: 403 }
        ),
        user: null,
      };
    }

    return { error: null, user };
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Invalid or expired token. Please login again.",
          },
          { status: 401 }
        ),
        user: null,
      };
    }

    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Authentication failed. Please try again.",
        },
        { status: 500 }
      ),
      user: null,
    };
  }
}

/**
 * Helper function to authenticate admin user from JWT token
 * Verifies that the user has admin role
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<{error: NextResponse|null, user: User|null}>} - Returns error response or authenticated admin user
 */
export async function authenticateAdmin(request) {
  try {
    // First authenticate the user
    const { error, user } = await authenticateUser(request);

    if (error) {
      return { error, user: null };
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Access denied. Admin privileges required.",
          },
          { status: 403 }
        ),
        user: null,
      };
    }

    return { error: null, user };
  } catch (error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Authentication failed. Please try again.",
        },
        { status: 500 }
      ),
      user: null,
    };
  }
}

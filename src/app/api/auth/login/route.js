import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

/**
 * POST /api/auth/login
 * Login user with email/username and password
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { emailOrUsername, password } = body;

    // Validate required fields
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide email/username and password",
        },
        { status: 400 }
      );
    }

    // Find user by credentials (handles email or username)
    let user;
    try {
      user = await User.findByCredentials(emailOrUsername, password);
    } catch (credError) {
      // Handle specific credential errors
      return NextResponse.json(
        {
          success: false,
          message: credError.message || "Invalid login credentials",
        },
        { status: 401 }
      );
    }

    // Check if user email is verified
    if (!user.isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in",
          data: {
            userId: user._id,
            email: user.email,
            isverified: false,
          },
        },
        { status: 403 }
      );
    }

    // Generate auth token
    const token = user.generateAuthToken();
    await user.save({ validateBeforeSave: false });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            isverified: user.isverified,
            phone: user.phone || null,
            address: user.address || null,
            profileimage: user.profileimage || null,
            lastLogin: user.lastLogin,
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Login failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

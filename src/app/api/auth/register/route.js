import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { sendOTPEmail } from "@/lib/email";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body (supports JSON and multipart/form-data with optional profile image)
    const contentType = request.headers.get("content-type") || "";
    let parsed = {};
    let profileImageFile = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      parsed = {
        firstname: form.get("firstname"),
        lastname: form.get("lastname"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone"),
        role: form.get("role") || "buyer",
      };

      // Address can be provided either as JSON string `address` or fielded `address.city`, etc.
      const addressRaw = form.get("address");
      const addressFields = {
        city: form.get("address.city"),
        state: form.get("address.state"),
        country: form.get("address.country"),
        pincode: form.get("address.pincode"),
      };

      let address = null;
      if (addressRaw && typeof addressRaw === "string") {
        try {
          address = JSON.parse(addressRaw);
        } catch (_) {
          // ignore invalid JSON
        }
      }
      if (
        !address &&
        (addressFields.city ||
          addressFields.state ||
          addressFields.country ||
          addressFields.pincode)
      ) {
        address = addressFields;
      }
      parsed.address = address;

      const file = form.get("profileimage");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        profileImageFile = file;
      }
    } else {
      parsed = await request.json();
    }

    const {
      firstname,
      lastname,
      email,
      password,
      phone,
      address,
      role = "buyer", // Default to buyer role
      profileimage,
    } = parsed;

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide all required fields: firstname, lastname, email, and password",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address format",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8 || password.length > 32) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 32 characters long",
        },
        { status: 400 }
      );
    }

    // Generate username automatically from firstname + lastname
    const generateUsername = (firstname, lastname) => {
      // Combine firstname and lastname, convert to lowercase, remove spaces and special characters
      let baseUsername = `${firstname}${lastname}`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, ""); // Remove all non-alphanumeric characters

      // Ensure minimum length of 3 characters
      if (baseUsername.length < 3) {
        baseUsername = baseUsername.padEnd(3, "0");
      }

      // Truncate to max 20 characters
      if (baseUsername.length > 20) {
        baseUsername = baseUsername.substring(0, 20);
      }

      return baseUsername;
    };

    // Generate base username
    let username = generateUsername(firstname, lastname);
    let usernameExists = true;
    let attemptCount = 0;
    const maxAttempts = 100;

    // Ensure username is unique by appending numbers if needed
    while (usernameExists && attemptCount < maxAttempts) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        isdeleted: false,
      });

      if (!existingUser) {
        usernameExists = false;
      } else {
        // Append a random number (1-9999) to make it unique
        const randomNum = Math.floor(Math.random() * 9999) + 1;
        const baseUsername = generateUsername(firstname, lastname);
        // Keep base username + number within 20 chars
        const numStr = randomNum.toString();
        const maxBaseLength = 20 - numStr.length;
        username = baseUsername.substring(0, maxBaseLength) + numStr;
        attemptCount++;
      }
    }

    if (usernameExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to generate unique username. Please try again.",
        },
        { status: 500 }
      );
    }

    // Validate role
    if (role && !["buyer", "admin"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role. Role must be either 'buyer' or 'admin'",
        },
        { status: 400 }
      );
    }

    // Check if user with email already exists (username uniqueness already checked above)
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      isdeleted: false,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Create new user
    const userData = {
      username: username.toLowerCase().trim(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    };

    // Add optional fields if provided
    if (phone) {
      userData.phone = phone.trim();
    }

    if (address) {
      userData.address = {
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        country: address.country?.trim() || "India",
        pincode: address.pincode?.trim() || "",
      };
    }

    // Handle profile image upload if provided
    if (profileImageFile) {
      try {
        const arrayBuffer = await profileImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: "fluxfit/users",
          resource_type: "image",
          tags: ["user", "profile", "fluxfit"],
          public_id: `user_${Date.now()}_${(username || "")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "")}`,
        });
        if (uploadResult?.success && uploadResult.url) {
          userData.profileimage = uploadResult.url;
        }
      } catch (e) {
        console.error("Profile image upload failed:", e);
      }
    } else if (profileimage && typeof profileimage === "string") {
      // Allow direct URL if provided in JSON
      userData.profileimage = profileimage;
    }

    // Set verification expiry (user will be auto-deleted if not verified within 10 minutes)
    const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");
    userData.verificationExpiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create(userData);

    // Generate OTP for email verification
    let otp = null;
    try {
      otp = await user.generateOTP("email-verification", OTP_EXPIRY_MINUTES);

      // Send OTP email
      const emailResult = await sendOTPEmail(
        user.email,
        otp,
        "email-verification"
      );

      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
        // Don't fail registration if email fails, just log it
      }
    } catch (otpError) {
      console.error("Error generating/sending OTP:", otpError);
      // Don't fail registration if OTP generation fails
    }

    // Generate auth token
    const token = user.generateAuthToken();
    await user.save({ validateBeforeSave: false });

    // Return success response (exclude sensitive data)
    return NextResponse.json(
      {
        success: true,
        message:
          `Please verify your email with the OTP sent to your email address. OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
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
            createdAt: user.createdAt,
          },
          token,
          otpSent: otp !== null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 }
      );
    }

    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          message: `User with this ${field} already exists`,
        },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

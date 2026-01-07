import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";

/**
 * GET /api/users/profile
 * Get current user profile
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Return user profile (password and token are excluded by model's toJSON transform)
    return NextResponse.json(
      {
        success: true,
        message: "Profile retrieved successfully",
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve profile. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/profile
 * Update user profile
 */
export async function PUT(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Parse request body
    const body = await request.json();
    const { firstname, lastname, phone, address, profileimage } = body;

    // Build update object with only provided fields
    const updateData = {};

    if (firstname !== undefined) {
      if (!firstname || firstname.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "First name cannot be empty",
            errors: [
              {
                field: "firstname",
                message: "First name is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.firstname = firstname.trim();
    }

    if (lastname !== undefined) {
      if (!lastname || lastname.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Last name cannot be empty",
            errors: [
              {
                field: "lastname",
                message: "Last name is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.lastname = lastname.trim();
    }

    if (phone !== undefined) {
      // Validate phone format (optional, but if provided should be valid)
      if (phone && phone.trim().length > 0) {
        // Basic phone validation (adjust regex as needed)
        const phoneRegex =
          /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(phone.trim())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid phone number format",
              errors: [
                {
                  field: "phone",
                  message: "Please provide a valid phone number",
                },
              ],
            },
            { status: 400 }
          );
        }
        updateData.phone = phone.trim();
      } else {
        updateData.phone = null;
      }
    }

    if (address !== undefined) {
      // Validate address structure if provided
      if (address && typeof address === "object") {
        const addressUpdate = {};
        if (address.city !== undefined) {
          addressUpdate.city = address.city?.trim() || null;
        }
        if (address.state !== undefined) {
          addressUpdate.state = address.state?.trim() || null;
        }
        if (address.country !== undefined) {
          addressUpdate.country = address.country?.trim() || "India";
        }
        if (address.pincode !== undefined) {
          addressUpdate.pincode = address.pincode?.trim() || null;
        }
        updateData.address = addressUpdate;
      } else if (address === null) {
        updateData.address = null;
      }
    }

    if (profileimage !== undefined) {
      updateData.profileimage = profileimage || null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided to update",
          errors: [
            {
              field: "body",
              message: "Please provide at least one field to update",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Return updated user profile
    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update profile. Please try again.",
      },
      { status: 500 }
    );
  }
}

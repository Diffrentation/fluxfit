import { NextResponse } from "next/server";
import Address from "@/models/address.model";
import { authenticateUser } from "@/lib/auth";

/**
 * GET /api/users/addresses
 * Get all addresses for the current user
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Get all addresses for the user (excluding deleted ones)
    const addresses = await Address.find({
      user: user._id,
      isDeleted: false,
    })
      .sort({ isDefault: -1, createdAt: -1 }) // Default addresses first, then by creation date
      .lean();

    // Format addresses for response
    const formattedAddresses = addresses.map((address) => ({
      id: address._id,
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      type: address.type,
      isDefault: address.isDefault,
      landmark: address.landmark || "",
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Addresses retrieved successfully",
        data: {
          addresses: formattedAddresses,
          count: formattedAddresses.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve addresses. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/addresses
 * Add a new address for the current user
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
      type,
      isDefault,
      landmark,
    } = body;

    // Validate required fields
    const errors = [];
    if (!name || !name.trim()) {
      errors.push({
        field: "name",
        message: "Name is required",
      });
    }
    if (!phone || !phone.trim()) {
      errors.push({
        field: "phone",
        message: "Phone number is required",
      });
    }
    if (!addressLine1 || !addressLine1.trim()) {
      errors.push({
        field: "addressLine1",
        message: "Address line 1 is required",
      });
    }
    if (!city || !city.trim()) {
      errors.push({
        field: "city",
        message: "City is required",
      });
    }
    if (!state || !state.trim()) {
      errors.push({
        field: "state",
        message: "State is required",
      });
    }
    if (!pincode || !pincode.trim()) {
      errors.push({
        field: "pincode",
        message: "Pincode is required",
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Validate type enum
    if (type && !["home", "work", "other"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid address type",
          errors: [
            {
              field: "type",
              message: "Type must be one of: home, work, other",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
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

    // Validate pincode (should be numeric, 4-10 digits)
    const pincodeRegex = /^[0-9]{4,10}$/;
    if (!pincodeRegex.test(pincode.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pincode format",
          errors: [
            {
              field: "pincode",
              message: "Pincode must be 4-10 digits",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create address data
    const addressData = {
      user: user._id,
      name: name.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",
      pincode: pincode.trim(),
      type: type || "home",
      landmark: landmark?.trim() || "",
      isDefault: isDefault === true,
    };

    // If setting as default, unset other default addresses
    if (addressData.isDefault) {
      await Address.updateMany(
        { user: user._id, isDeleted: false },
        { isDefault: false }
      );
    } else {
      // If this is the first address, make it default automatically
      const existingAddresses = await Address.countDocuments({
        user: user._id,
        isDeleted: false,
      });
      if (existingAddresses === 0) {
        addressData.isDefault = true;
      }
    }

    // Create new address
    const newAddress = new Address(addressData);
    await newAddress.save();

    // Return created address
    return NextResponse.json(
      {
        success: true,
        message: "Address added successfully",
        data: {
          address: {
            id: newAddress._id,
            name: newAddress.name,
            phone: newAddress.phone,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2 || "",
            city: newAddress.city,
            state: newAddress.state,
            country: newAddress.country,
            pincode: newAddress.pincode,
            type: newAddress.type,
            isDefault: newAddress.isDefault,
            landmark: newAddress.landmark || "",
            createdAt: newAddress.createdAt,
            updatedAt: newAddress.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add address error:", error);

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
        message: error.message || "Failed to add address. Please try again.",
      },
      { status: 500 }
    );
  }
}

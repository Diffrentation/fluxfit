import { NextResponse } from "next/server";
import Address from "@/models/address.model";
import mongoose from "mongoose";
import { authenticateUser } from "@/lib/auth";

/**
 * PUT /api/users/addresses/:id
 * Update an address
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Get address ID from params (await params in Next.js 16)
    const { id } = await params;

    // Validate address ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid address ID",
          errors: [
            {
              field: "id",
              message: "Invalid address ID format",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Find address and verify ownership
    const address = await Address.findOne({
      _id: id,
      user: user._id,
      isDeleted: false,
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Address not found or you don't have permission to update it",
        },
        { status: 404 }
      );
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

    // Build update object with only provided fields
    const updateData = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Name cannot be empty",
            errors: [
              {
                field: "name",
                message: "Name is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (!phone || !phone.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Phone number cannot be empty",
            errors: [
              {
                field: "phone",
                message: "Phone number is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      // Validate phone format
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
    }

    if (addressLine1 !== undefined) {
      if (!addressLine1 || !addressLine1.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Address line 1 cannot be empty",
            errors: [
              {
                field: "addressLine1",
                message: "Address line 1 is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.addressLine1 = addressLine1.trim();
    }

    if (addressLine2 !== undefined) {
      updateData.addressLine2 = addressLine2?.trim() || "";
    }

    if (city !== undefined) {
      if (!city || !city.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "City cannot be empty",
            errors: [
              {
                field: "city",
                message: "City is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.city = city.trim();
    }

    if (state !== undefined) {
      if (!state || !state.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "State cannot be empty",
            errors: [
              {
                field: "state",
                message: "State is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      updateData.state = state.trim();
    }

    if (country !== undefined) {
      updateData.country = country?.trim() || "India";
    }

    if (pincode !== undefined) {
      if (!pincode || !pincode.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Pincode cannot be empty",
            errors: [
              {
                field: "pincode",
                message: "Pincode is required",
              },
            ],
          },
          { status: 400 }
        );
      }
      // Validate pincode format
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
      updateData.pincode = pincode.trim();
    }

    if (type !== undefined) {
      if (!["home", "work", "other"].includes(type)) {
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
      updateData.type = type;
    }

    if (landmark !== undefined) {
      updateData.landmark = landmark?.trim() || "";
    }

    // Handle isDefault update
    if (isDefault !== undefined) {
      if (isDefault === true) {
        // Unset other default addresses for this user
        await Address.updateMany(
          { user: user._id, _id: { $ne: address._id }, isDeleted: false },
          { isDefault: false }
        );
        updateData.isDefault = true;
      } else {
        // If unsetting default, check if there are other addresses
        const otherAddresses = await Address.countDocuments({
          user: user._id,
          _id: { $ne: address._id },
          isDeleted: false,
        });
        if (otherAddresses === 0) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Cannot unset default address. At least one address must be default",
              errors: [
                {
                  field: "isDefault",
                  message: "You must have at least one default address",
                },
              ],
            },
            { status: 400 }
          );
        }
        updateData.isDefault = false;
      }
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

    // Update address
    Object.assign(address, updateData);
    await address.save();

    // Return updated address
    return NextResponse.json(
      {
        success: true,
        message: "Address updated successfully",
        data: {
          address: {
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
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update address error:", error);

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
        message: error.message || "Failed to update address. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/addresses/:id
 * Delete an address (soft delete)
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Get address ID from params (await params in Next.js 16)
    const { id } = await params;

    // Validate address ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid address ID",
          errors: [
            {
              field: "id",
              message: "Invalid address ID format",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Find address and verify ownership
    const address = await Address.findOne({
      _id: id,
      user: user._id,
      isDeleted: false,
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Address not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Check if this is the only address
    const addressCount = await Address.countDocuments({
      user: user._id,
      isDeleted: false,
    });

    if (addressCount === 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete the last address. You must have at least one address",
          errors: [
            {
              field: "address",
              message: "You must have at least one address",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Soft delete the address
    address.isDeleted = true;
    address.deletedAt = new Date();

    // If this was the default address, set another address as default
    if (address.isDefault) {
      const otherAddress = await Address.findOne({
        user: user._id,
        _id: { $ne: address._id },
        isDeleted: false,
      });

      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();
      }
    }

    await address.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Address deleted successfully",
        data: {
          message: "Address has been deleted successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete address. Please try again.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Address from "@/models/address.model";
import mongoose from "mongoose";
import { authenticateUser } from "@/lib/auth";

/**
 * PUT /api/users/addresses/:id/default
 * Set an address as default
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Get address ID from params
    const { id } = params;

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
            "Address not found or you don't have permission to modify it",
        },
        { status: 404 }
      );
    }

    // Check if already default
    if (address.isDefault) {
      return NextResponse.json(
        {
          success: true,
          message: "Address is already set as default",
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
    }

    // Use the model method to set as default (this will unset other defaults)
    await address.setAsDefault();

    // Return updated address
    return NextResponse.json(
      {
        success: true,
        message: "Address set as default successfully",
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
    console.error("Set default address error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to set default address. Please try again.",
      },
      { status: 500 }
    );
  }
}

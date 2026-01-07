import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SMSTemplate from "@/models/smstemplate.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/settings/sms-templates/:id
 * Update SMS template
 * 
 * Body Parameters (all optional):
 * - name: Template name (unique)
 * - message: SMS message (max 160 characters)
 * - type: Template type
 * - variables: Array of variable objects { name, description }
 * - isActive: Active status
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get template ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid SMS template ID",
          errors: [{ field: "id", message: "Valid SMS template ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get SMS template
    const smsTemplate = await SMSTemplate.findById(id);
    if (!smsTemplate) {
      return NextResponse.json(
        {
          success: false,
          message: "SMS template not found",
        },
        { status: 404 }
      );
    }

    // Get body
    const body = await request.json();
    const { name, message, type, variables, isActive } = body;

    // Update name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Template name cannot be empty",
            errors: [{ field: "name", message: "Template name is required" }],
          },
          { status: 400 }
        );
      }

      // Check if name already exists (excluding current template)
      if (name.trim() !== smsTemplate.name) {
        const existingTemplate = await SMSTemplate.findOne({
          name: name.trim(),
          _id: { $ne: id },
        });

        if (existingTemplate) {
          return NextResponse.json(
            {
              success: false,
              message: "SMS template name already exists",
              errors: [
                {
                  field: "name",
                  message: `SMS template with name "${name.trim()}" already exists`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
      smsTemplate.name = name.trim();
    }

    // Update message if provided
    if (message !== undefined) {
      if (!message || !message.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "SMS message cannot be empty",
            errors: [{ field: "message", message: "SMS message is required" }],
          },
          { status: 400 }
        );
      }

      if (message.length > 160) {
        return NextResponse.json(
          {
            success: false,
            message: "SMS message cannot exceed 160 characters",
            errors: [
              {
                field: "message",
                message: "SMS message must be 160 characters or less",
              },
            ],
          },
          { status: 400 }
        );
      }
      smsTemplate.message = message.trim();
    }

    // Update type if provided
    if (type !== undefined) {
      const validTypes = [
        "otp",
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "payment-success",
        "payment-failed",
        "custom",
      ];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid template type. Must be one of: ${validTypes.join(", ")}`,
            errors: [
              {
                field: "type",
                message: `Template type must be one of: ${validTypes.join(", ")}`,
              },
            ],
          },
          { status: 400 }
        );
      }
      smsTemplate.type = type;
    }

    // Update variables if provided
    if (variables !== undefined) {
      if (Array.isArray(variables)) {
        for (let i = 0; i < variables.length; i++) {
          const variable = variables[i];
          if (!variable.name || !variable.name.trim()) {
            return NextResponse.json(
              {
                success: false,
                message: `Variable ${i + 1} name is required`,
                errors: [
                  {
                    field: `variables[${i}].name`,
                    message: "Variable name is required",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
        smsTemplate.variables = variables.map((v) => ({
          name: v.name.trim(),
          description: v.description ? v.description.trim() : "",
        }));
      } else {
        smsTemplate.variables = [];
      }
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be a boolean",
            errors: [
              {
                field: "isActive",
                message: "isActive must be true or false",
              },
            ],
          },
          { status: 400 }
        );
      }
      smsTemplate.isActive = isActive;
    }

    // Save SMS template
    await smsTemplate.save();

    // Format SMS template
    const formattedTemplate = {
      id: smsTemplate._id,
      name: smsTemplate.name,
      message: smsTemplate.message,
      type: smsTemplate.type,
      variables: smsTemplate.variables || [],
      isActive: smsTemplate.isActive,
      createdAt: smsTemplate.createdAt,
      updatedAt: smsTemplate.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "SMS template updated successfully",
        data: {
          template: formattedTemplate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update SMS template error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "SMS template name already exists",
          errors: [
            {
              field: "name",
              message: "A template with this name already exists",
            },
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update SMS template. Please try again.",
      },
      { status: 500 }
    );
  }
}


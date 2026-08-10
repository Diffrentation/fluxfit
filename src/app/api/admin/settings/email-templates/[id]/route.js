import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EmailTemplate from "@/models/emailtemplate.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/settings/email-templates/:id
 * Update email template
 * 
 * Body Parameters (all optional):
 * - name: Template name (unique)
 * - subject: Email subject
 * - body: Email body (HTML/text)
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
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email template ID",
          errors: [{ field: "id", message: "Valid email template ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get email template
    const emailTemplate = await EmailTemplate.findById(id);
    if (!emailTemplate) {
      return NextResponse.json(
        {
          success: false,
          message: "Email template not found",
        },
        { status: 404 }
      );
    }

    // Get body
    const body = await request.json();
    const { name, subject, body: templateBody, type, variables, isActive } = body;

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
      if (name.trim() !== emailTemplate.name) {
        const existingTemplate = await EmailTemplate.findOne({
          name: name.trim(),
          _id: { $ne: id },
        });

        if (existingTemplate) {
          return NextResponse.json(
            {
              success: false,
              message: "Email template name already exists",
              errors: [
                {
                  field: "name",
                  message: `Email template with name "${name.trim()}" already exists`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
      emailTemplate.name = name.trim();
    }

    // Update subject if provided
    if (subject !== undefined) {
      if (!subject || !subject.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Email subject cannot be empty",
            errors: [{ field: "subject", message: "Email subject is required" }],
          },
          { status: 400 }
        );
      }
      emailTemplate.subject = subject.trim();
    }

    // Update body if provided
    if (templateBody !== undefined) {
      if (!templateBody || !templateBody.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Email body cannot be empty",
            errors: [{ field: "body", message: "Email body is required" }],
          },
          { status: 400 }
        );
      }
      emailTemplate.body = templateBody;
    }

    // Update type if provided
    if (type !== undefined) {
      const validTypes = [
        "welcome",
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "order-cancelled",
        "password-reset",
        "admin-password-reset",
        "email-verification",
        "payment-success",
        "payment-failed",
        "refund-processed",
        "newsletter",
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
      emailTemplate.type = type;
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
        emailTemplate.variables = variables.map((v) => ({
          name: v.name.trim(),
          description: v.description ? v.description.trim() : "",
        }));
      } else {
        emailTemplate.variables = [];
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
      emailTemplate.isActive = isActive;
    }

    // Save email template
    await emailTemplate.save();

    // Format email template
    const formattedTemplate = {
      id: emailTemplate._id,
      name: emailTemplate.name,
      subject: emailTemplate.subject,
      body: emailTemplate.body,
      type: emailTemplate.type,
      variables: emailTemplate.variables || [],
      isActive: emailTemplate.isActive,
      createdAt: emailTemplate.createdAt,
      updatedAt: emailTemplate.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Email template updated successfully",
        data: {
          template: formattedTemplate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update email template error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Email template name already exists",
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
        message: error.message || "Failed to update email template. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/email-templates/:id
 */
export async function DELETE(request, { params }) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid email template ID" },
        { status: 400 }
      );
    }

    const deleted = await EmailTemplate.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Email template deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete email template error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete email template. Please try again.",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SMSTemplate from "@/models/smstemplate.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/sms-templates
 * Get SMS templates
 * 
 * Query Parameters:
 * - isActive: Filter by active status - "true", "false" (optional)
 * - type: Filter by template type (optional)
 * - sort: Sort order - "newest" (default), "oldest", "name-asc", "name-desc", "type"
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    if (type) {
      const validTypes = [
        "otp",
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "payment-success",
        "payment-failed",
        "custom",
      ];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "name-asc":
        sortObj.name = 1;
        break;
      case "name-desc":
        sortObj.name = -1;
        break;
      case "type":
        sortObj.type = 1;
        sortObj.name = 1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Get SMS templates
    const smsTemplates = await SMSTemplate.find(query).sort(sortObj).lean();

    // Format SMS templates
    const formattedTemplates = smsTemplates.map((template) => ({
      id: template._id,
      name: template.name,
      message: template.message,
      type: template.type,
      variables: template.variables || [],
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "SMS templates retrieved successfully",
        data: {
          templates: formattedTemplates,
          count: formattedTemplates.length,
          filters: {
            isActive: isActive || null,
            type: type || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get SMS templates error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve SMS templates. Please try again.",
      },
      { status: 500 }
    );
  }
}

const VALID_SMS_TEMPLATE_TYPES = [
  "otp",
  "order-confirmation",
  "order-shipped",
  "order-delivered",
  "payment-success",
  "payment-failed",
  "custom",
];

/**
 * POST /api/admin/settings/sms-templates
 * Create a new SMS template
 *
 * Body Parameters:
 * - name: Template name, unique (required)
 * - message: SMS body, max 160 chars, with {{variable}} placeholders (required)
 * - type: One of VALID_SMS_TEMPLATE_TYPES (required)
 * - variables: Array of { name, description } (optional)
 * - isActive: Active status (default true)
 */
export async function POST(request) {
  try {
    const { error } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const body = await request.json();
    const { name, message: smsMessage, type, variables, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Template name is required",
          errors: [{ field: "name", message: "Template name is required" }],
        },
        { status: 400 }
      );
    }

    if (!smsMessage || !smsMessage.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "SMS message is required",
          errors: [{ field: "message", message: "SMS message is required" }],
        },
        { status: 400 }
      );
    }

    if (smsMessage.length > 160) {
      return NextResponse.json(
        {
          success: false,
          message: "SMS message must be 160 characters or fewer",
          errors: [{ field: "message", message: "SMS message must be 160 characters or fewer" }],
        },
        { status: 400 }
      );
    }

    if (!type || !VALID_SMS_TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid template type. Must be one of: ${VALID_SMS_TEMPLATE_TYPES.join(", ")}`,
          errors: [
            {
              field: "type",
              message: `Template type must be one of: ${VALID_SMS_TEMPLATE_TYPES.join(", ")}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    const normalizedVariables = Array.isArray(variables)
      ? variables
          .filter((v) => v?.name?.trim())
          .map((v) => ({
            name: v.name.trim(),
            description: v.description ? v.description.trim() : "",
          }))
      : [];

    const template = await SMSTemplate.create({
      name: name.trim(),
      message: smsMessage,
      type,
      variables: normalizedVariables,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "SMS template created successfully",
        data: {
          template: {
            id: template._id,
            name: template.name,
            message: template.message,
            type: template.type,
            variables: template.variables || [],
            isActive: template.isActive,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create SMS template error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A template with this name already exists",
          errors: [{ field: "name", message: "Template name must be unique" }],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create SMS template. Please try again.",
      },
      { status: 500 }
    );
  }
}


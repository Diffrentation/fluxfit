import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EmailTemplate from "@/models/emailtemplate.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/email-templates
 * Get email templates
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

    // Get email templates
    const emailTemplates = await EmailTemplate.find(query).sort(sortObj).lean();

    // Format email templates
    const formattedTemplates = emailTemplates.map((template) => ({
      id: template._id,
      name: template.name,
      subject: template.subject,
      body: template.body,
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
        message: "Email templates retrieved successfully",
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
    console.error("Get email templates error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve email templates. Please try again.",
      },
      { status: 500 }
    );
  }
}

const VALID_EMAIL_TEMPLATE_TYPES = [
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

/**
 * POST /api/admin/settings/email-templates
 * Create a new email template
 *
 * Body Parameters:
 * - name: Template name, unique (required)
 * - subject: Email subject (required)
 * - body: Email body, HTML or text with {{variable}} placeholders (required)
 * - type: One of VALID_EMAIL_TEMPLATE_TYPES (required)
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
    const { name, subject, body: templateBody, type, variables, isActive } = body;

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

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Email subject is required",
          errors: [{ field: "subject", message: "Email subject is required" }],
        },
        { status: 400 }
      );
    }

    if (!templateBody || !templateBody.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Email body is required",
          errors: [{ field: "body", message: "Email body is required" }],
        },
        { status: 400 }
      );
    }

    if (!type || !VALID_EMAIL_TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid template type. Must be one of: ${VALID_EMAIL_TEMPLATE_TYPES.join(", ")}`,
          errors: [
            {
              field: "type",
              message: `Template type must be one of: ${VALID_EMAIL_TEMPLATE_TYPES.join(", ")}`,
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

    const template = await EmailTemplate.create({
      name: name.trim(),
      subject: subject.trim(),
      body: templateBody,
      type,
      variables: normalizedVariables,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email template created successfully",
        data: {
          template: {
            id: template._id,
            name: template.name,
            subject: template.subject,
            body: template.body,
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
    console.error("Create email template error:", error);

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
        message: error.message || "Failed to create email template. Please try again.",
      },
      { status: 500 }
    );
  }
}


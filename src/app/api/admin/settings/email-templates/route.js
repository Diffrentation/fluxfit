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


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/settings.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/website
 * Get website settings
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

    // Get settings (singleton pattern)
    const settings = await Settings.getSettings();

    // Format website settings
    const websiteSettings = {
      name: settings.website?.name || "FluxFit",
      logo: settings.website?.logo || null,
      favicon: settings.website?.favicon || null,
      email: settings.website?.email || null,
      phone: settings.website?.phone || null,
      address: {
        line1: settings.website?.address?.line1 || "",
        line2: settings.website?.address?.line2 || "",
        city: settings.website?.address?.city || "",
        state: settings.website?.address?.state || "",
        country: settings.website?.address?.country || "India",
        pincode: settings.website?.address?.pincode || "",
      },
      socialMedia: {
        facebook: settings.website?.socialMedia?.facebook || "",
        twitter: settings.website?.socialMedia?.twitter || "",
        instagram: settings.website?.socialMedia?.instagram || "",
        linkedin: settings.website?.socialMedia?.linkedin || "",
        youtube: settings.website?.socialMedia?.youtube || "",
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Website settings retrieved successfully",
        data: {
          settings: websiteSettings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get website settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve website settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/website
 * Update website settings
 * 
 * Body Parameters (all optional):
 * - name: Website name
 * - logo: Logo URL
 * - favicon: Favicon URL
 * - email: Contact email
 * - phone: Contact phone
 * - address: Address object { line1, line2, city, state, country, pincode }
 * - socialMedia: Social media object { facebook, twitter, instagram, linkedin, youtube }
 */
export async function PUT(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get body
    const body = await request.json();
    const {
      name,
      logo,
      favicon,
      email,
      phone,
      address,
      socialMedia,
    } = body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
          errors: [{ field: "email", message: "Please provide a valid email address" }],
        },
        { status: 400 }
      );
    }

    // Validate phone format if provided (basic validation)
    if (phone && phone.trim() && !/^[\d\s\+\-\(\)]+$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone format",
          errors: [{ field: "phone", message: "Please provide a valid phone number" }],
        },
        { status: 400 }
      );
    }

    // Validate URL format for logo and favicon if provided
    if (logo && logo.trim() && !/^https?:\/\/.+/.test(logo)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid logo URL format",
          errors: [{ field: "logo", message: "Logo must be a valid HTTP/HTTPS URL" }],
        },
        { status: 400 }
      );
    }

    if (favicon && favicon.trim() && !/^https?:\/\/.+/.test(favicon)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid favicon URL format",
          errors: [{ field: "favicon", message: "Favicon must be a valid HTTP/HTTPS URL" }],
        },
        { status: 400 }
      );
    }

    // Validate social media URLs if provided
    if (socialMedia) {
      const socialMediaFields = ["facebook", "twitter", "instagram", "linkedin", "youtube"];
      for (const field of socialMediaFields) {
        if (socialMedia[field] && socialMedia[field].trim() && !/^https?:\/\/.+/.test(socialMedia[field])) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid ${field} URL format`,
              errors: [
                {
                  field: `socialMedia.${field}`,
                  message: `${field} URL must be a valid HTTP/HTTPS URL`,
                },
              ],
            },
            { status: 400 }
          );
        }
      }
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Build update object
    const updates = {
      website: {
        ...settings.website,
      },
    };

    // Update fields if provided
    if (name !== undefined) {
      updates.website.name = name.trim();
    }

    if (logo !== undefined) {
      updates.website.logo = logo ? logo.trim() : null;
    }

    if (favicon !== undefined) {
      updates.website.favicon = favicon ? favicon.trim() : null;
    }

    if (email !== undefined) {
      updates.website.email = email ? email.trim() : null;
    }

    if (phone !== undefined) {
      updates.website.phone = phone ? phone.trim() : null;
    }

    if (address !== undefined) {
      updates.website.address = {
        ...settings.website.address,
        ...(address.line1 !== undefined && { line1: address.line1.trim() }),
        ...(address.line2 !== undefined && { line2: address.line2.trim() }),
        ...(address.city !== undefined && { city: address.city.trim() }),
        ...(address.state !== undefined && { state: address.state.trim() }),
        ...(address.country !== undefined && { country: address.country.trim() }),
        ...(address.pincode !== undefined && { pincode: address.pincode.trim() }),
      };
    }

    if (socialMedia !== undefined) {
      updates.website.socialMedia = {
        ...settings.website.socialMedia,
        ...(socialMedia.facebook !== undefined && {
          facebook: socialMedia.facebook ? socialMedia.facebook.trim() : "",
        }),
        ...(socialMedia.twitter !== undefined && {
          twitter: socialMedia.twitter ? socialMedia.twitter.trim() : "",
        }),
        ...(socialMedia.instagram !== undefined && {
          instagram: socialMedia.instagram ? socialMedia.instagram.trim() : "",
        }),
        ...(socialMedia.linkedin !== undefined && {
          linkedin: socialMedia.linkedin ? socialMedia.linkedin.trim() : "",
        }),
        ...(socialMedia.youtube !== undefined && {
          youtube: socialMedia.youtube ? socialMedia.youtube.trim() : "",
        }),
      };
    }

    // Update settings
    const updatedSettings = await Settings.updateSettings(updates);

    // Format updated website settings
    const websiteSettings = {
      name: updatedSettings.website?.name || "FluxFit",
      logo: updatedSettings.website?.logo || null,
      favicon: updatedSettings.website?.favicon || null,
      email: updatedSettings.website?.email || null,
      phone: updatedSettings.website?.phone || null,
      address: {
        line1: updatedSettings.website?.address?.line1 || "",
        line2: updatedSettings.website?.address?.line2 || "",
        city: updatedSettings.website?.address?.city || "",
        state: updatedSettings.website?.address?.state || "",
        country: updatedSettings.website?.address?.country || "India",
        pincode: updatedSettings.website?.address?.pincode || "",
      },
      socialMedia: {
        facebook: updatedSettings.website?.socialMedia?.facebook || "",
        twitter: updatedSettings.website?.socialMedia?.twitter || "",
        instagram: updatedSettings.website?.socialMedia?.instagram || "",
        linkedin: updatedSettings.website?.socialMedia?.linkedin || "",
        youtube: updatedSettings.website?.socialMedia?.youtube || "",
      },
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Website settings updated successfully",
        data: {
          settings: websiteSettings,
          updatedBy: {
            id: user._id,
            email: user.email,
          },
          updatedAt: updatedSettings.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update website settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update website settings. Please try again.",
      },
      { status: 500 }
    );
  }
}


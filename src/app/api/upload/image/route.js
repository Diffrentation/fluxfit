import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { authenticateUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * POST /api/upload/image
 * Upload single image to Cloudinary — requires an authenticated user.
 */
export async function POST(request) {
  try {
    const { error } = await authenticateUser(request);
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "fluxfit";
    const publicId = formData.get("public_id") || undefined;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, SVG.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: "File is too large. Maximum size is 8MB.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: publicId,
      resource_type: "image",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to upload image",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload image",
      },
      { status: 500 }
    );
  }
}

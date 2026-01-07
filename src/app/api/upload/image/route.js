import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * POST /api/upload/image
 * Upload single image to Cloudinary
 */
export async function POST(request) {
  try {
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

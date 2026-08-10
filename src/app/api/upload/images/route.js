import { NextResponse } from "next/server";
import { uploadMultipleToCloudinary } from "@/lib/cloudinary";
import { authenticateUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 10;

/**
 * POST /api/upload/images
 * Upload multiple images to Cloudinary — requires an authenticated user.
 */
export async function POST(request) {
  try {
    const { error } = await authenticateUser(request);
    if (error) return error;

    const formData = await request.formData();
    const files = formData.getAll("files");
    const folder = formData.get("folder") || "fluxfit";
    const publicId = formData.get("public_id") || undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No files provided",
        },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many files. Maximum is ${MAX_FILES} per upload.`,
        },
        { status: 400 }
      );
    }

    const invalid = files.find(
      (f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_BYTES
    );
    if (invalid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more files are invalid. Allowed types: JPEG, PNG, WEBP, GIF, SVG, max 8MB each.",
        },
        { status: 400 }
      );
    }

    // Convert files to buffers
    const buffers = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return Buffer.from(arrayBuffer);
      })
    );

    // Upload to Cloudinary
    const results = await uploadMultipleToCloudinary(buffers, {
      folder,
      public_id: publicId,
      resource_type: "image",
    });

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json(
      {
        success: successful.length > 0,
        message: `${successful.length} image(s) uploaded successfully${
          failed.length > 0 ? `, ${failed.length} failed` : ""
        }`,
        data: {
          images: successful.map((r) => ({
            url: r.url,
            public_id: r.public_id,
            format: r.format,
            width: r.width,
            height: r.height,
            bytes: r.bytes,
          })),
          failed: failed.length,
        },
      },
      { status: successful.length > 0 ? 200 : 500 }
    );
  } catch (error) {
    console.error("Images upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload images",
      },
      { status: 500 }
    );
  }
}

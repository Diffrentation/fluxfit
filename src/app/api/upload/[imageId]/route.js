import { NextResponse } from "next/server";
import { deleteFromCloudinary } from "@/lib/cloudinary";

/**
 * DELETE /api/upload/:imageId
 * Delete image from Cloudinary
 */
export async function DELETE(request, { params }) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          message: "Image ID is required",
        },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(imageId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to delete image",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete image",
      },
      { status: 500 }
    );
  }
}

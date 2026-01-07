// This file is server-only - uses Node.js modules
// DO NOT import this in client components - use /api/upload endpoints instead
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary (server-side)
 * @param {Buffer|string|Readable} file - File buffer, file path, or readable stream
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder path in Cloudinary
 * @param {string} options.public_id - Public ID for the file
 * @param {string} options.resource_type - Resource type (image, video, raw, auto)
 * @param {Array} options.tags - Tags for the file
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    // Validate Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary configuration is missing. Please check your .env file"
      );
    }

    const uploadOptions = {
      folder: options.folder || "fluxfit",
      resource_type: options.resource_type || "auto",
      ...options,
    };

    const result = await new Promise((resolve, reject) => {
      // Handle different file types
      if (typeof file === "string") {
        // If it's a file path
        cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ Cloudinary upload successful:", result.public_id);
            resolve(result);
          }
        });
      } else {
        // If it's a Buffer or stream, use upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("✅ Cloudinary upload successful:", result.public_id);
              resolve(result);
            }
          }
        );

        // Pipe the file to the upload stream
        if (Buffer.isBuffer(file)) {
          Readable.from(file).pipe(uploadStream);
        } else {
          // If it's already a stream
          file.pipe(uploadStream);
        }
      }
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      ...result,
    };
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileOptions = {
        ...options,
        public_id: options.public_id
          ? `${options.public_id}_${index}`
          : undefined,
      };
      return uploadToCloudinary(file, fileOptions);
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("❌ Error uploading multiple files to Cloudinary:", error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {Object} options - Delete options
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    console.log("✅ Cloudinary deletion successful:", publicId);
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("❌ Error deleting from Cloudinary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate Cloudinary image URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Cloudinary transformation options
 * @returns {string} - Transformed image URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

/**
 * Cloudinary Upload Widget (client-side)
 * Requires Cloudinary upload widget script to be loaded
 * Add to your layout: <script src="https://upload-widget.cloudinary.com/global/all.js"></script>
 */
export const openCloudinaryWidget = (callback, options = {}) => {
  if (typeof window === "undefined") {
    console.warn("Cloudinary widget can only be used on the client side");
    return;
  }

  if (typeof window.cloudinary === "undefined") {
    console.warn(
      "Cloudinary widget not loaded. Please add the script to your HTML."
    );
    return;
  }

  const widgetOptions = {
    cloudName:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: options.uploadPreset || "fluxfit_upload",
    sources: options.sources || ["local", "camera", "url"],
    multiple: options.multiple !== undefined ? options.multiple : true,
    maxFiles: options.maxFiles || 5,
    folder: options.folder || "fluxfit",
    ...options,
  };

  window.cloudinary
    .createUploadWidget(widgetOptions, (error, result) => {
      if (!error && result && result.event === "success") {
        callback(result.info);
      } else if (error) {
        console.error("Cloudinary widget error:", error);
      }
    })
    .open();
};

const cloudinaryService = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  openCloudinaryWidget,
};

export default cloudinaryService;

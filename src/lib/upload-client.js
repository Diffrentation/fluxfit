/**
 * Client-side upload utility
 * Use this in client components instead of cloudinary.js
 */

// This module uses raw fetch() (not axios), so it doesn't get the app-wide
// axios request interceptor that attaches the Bearer token automatically —
// it has to be added explicitly here.
const authHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token && token !== "null" && token !== "undefined"
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/**
 * Upload image via API endpoint
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder path in Cloudinary
 * @param {string} options.public_id - Public ID for the file
 * @returns {Promise<Object>} - Upload result
 */
export const uploadImage = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.public_id) {
      formData.append("public_id", options.public_id);
    }

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Upload failed");
    }

    return result.data;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
};

/**
 * Upload multiple images via API endpoint
 * @param {File[]} files - Files to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder path in Cloudinary
 * @param {string} options.public_id - Public ID prefix
 * @returns {Promise<Object>} - Upload result
 */
export const uploadImages = async (files, options = {}) => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.public_id) {
      formData.append("public_id", options.public_id);
    }

    const response = await fetch("/api/upload/images", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Upload failed");
    }

    return result.data;
  } catch (error) {
    console.error("Images upload error:", error);
    throw error;
  }
};

/**
 * Delete image via API endpoint
 * @param {string} publicId - Public ID of image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const response = await fetch(`/api/upload/${publicId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Deletion failed");
    }

    return result;
  } catch (error) {
    console.error("Image deletion error:", error);
    throw error;
  }
};

const uploadClient = {
  uploadImage,
  uploadImages,
  deleteImage,
};

export default uploadClient;

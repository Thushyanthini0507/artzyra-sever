/**
 * Cloudinary Utility
 * Handles image uploads to Cloudinary with folder organization
 */
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Validate Cloudinary configuration
const isCloudinaryConfigured = () => {
  return !!(cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret);
};

// Always configure cloudinary (even with undefined values) to prevent runtime errors
// The actual validation happens in uploadToCloudinary
cloudinary.config(cloudinaryConfig);

if (!isCloudinaryConfigured()) {
  console.warn("⚠️ Cloudinary is not configured. Image uploads will fail.");
  console.warn("💡 Please set the following environment variables:");
  console.warn("   - CLOUDINARY_CLOUD_NAME");
  console.warn("   - CLOUDINARY_API_KEY");
  console.warn("   - CLOUDINARY_API_SECRET");
} else {
  console.log("✅ Cloudinary configured successfully");
}

// Base folder path
const BASE_FOLDER = "assets/folder-home-artzyra";

// Folder mapping for different image types
const FOLDER_MAP = {
  category: `${BASE_FOLDER}/categories`,
  admin_profile: `${BASE_FOLDER}/admin_profile`,
  customer_profile: `${BASE_FOLDER}/customer_profile`,
  artist_profile: `${BASE_FOLDER}/artist_profile`,
};

/**
 * Upload image to Cloudinary with folder organization
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} imageType - Type of image: 'category', 'admin_profile', 'customer_profile', 'artist_profile'
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadToCloudinary = async (file, imageType = "category", options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
      );
    }

    // Validate image type
    if (!FOLDER_MAP[imageType]) {
      throw new Error(`Invalid image type: ${imageType}. Must be one of: ${Object.keys(FOLDER_MAP).join(", ")}`);
    }

    // Get folder path for this image type
    const folderPath = FOLDER_MAP[imageType];

    // Prepare upload options
    const uploadOptions = {
      folder: folderPath,
      resource_type: "image",
      ...options,
    };

    let uploadResult;

    // Handle different file input types
    if (Buffer.isBuffer(file)) {
      // Convert buffer to base64 data URI
      const base64String = file.toString("base64");
      const mimeType = options.mimeType || "image/jpeg";
      uploadResult = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${base64String}`,
        uploadOptions
      );
    } else if (typeof file === "string") {
      // Base64 string or data URL
      let dataUri = file;
      if (!file.startsWith("data:")) {
        // Assume it's base64 without data URI prefix
        dataUri = `data:image/jpeg;base64,${file}`;
      }
      uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);
    } else {
      throw new Error("Invalid file format. Expected Buffer or base64 string.");
    }

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

export default cloudinary;


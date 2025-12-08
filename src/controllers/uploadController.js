/**
 * Upload Controller
 * Handles image uploads to Cloudinary with folder organization
 */
import { asyncHandler } from "../middleware/authMiddleware.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { BadRequestError } from "../utils/errors.js";

/**
 * Upload image endpoint
 * @route POST /api/upload
 * @body {File} image - Image file
 * @body {string} imageType - Type of image: 'category', 'admin_profile', 'customer_profile', 'artist_profile'
 */
export const uploadImage = asyncHandler(async (req, res) => {
  // Log request details for debugging
  console.log("Upload controller - Request received:", {
    hasFile: !!req.file,
    fileField: req.file ? req.file.fieldname : "none",
    fileSize: req.file ? req.file.size : 0,
    fileMimetype: req.file ? req.file.mimetype : "none",
    imageType: req.body.imageType,
    bodyKeys: Object.keys(req.body),
    contentType: req.headers["content-type"],
  });

  if (!req.file) {
    console.error("No file in request!");
    console.error("Request body keys:", Object.keys(req.body));
    console.error("Request headers:", {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
    });
    throw new BadRequestError(
      "No image file provided. Please ensure the file is uploaded with the field name 'image' and Content-Type is multipart/form-data"
    );
  }

  // Get image type from request body, default to 'category'
  const imageType = req.body.imageType || "category";

  // Validate image type
  const validTypes = ["category", "admin_profile", "customer_profile", "artist_profile"];
  if (!validTypes.includes(imageType)) {
    throw new BadRequestError(
      `Invalid image type '${imageType}'. Must be one of: ${validTypes.join(", ")}`
    );
  }

  try {
    // Upload to Cloudinary with folder organization
    const result = await uploadToCloudinary(req.file.buffer, imageType, {
      mimeType: req.file.mimetype,
    });

    res.json({
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Re-throw with more context if it's not already a custom error
    if (error.message && error.message.includes("Cloudinary")) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError(`Failed to upload image: ${error.message || "Unknown error"}`);
  }
});


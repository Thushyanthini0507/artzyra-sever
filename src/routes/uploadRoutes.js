/**
 * Upload Routes
 * Handles image upload endpoints
 */
import express from "express";
import multer from "multer";
import { BadRequestError } from "../utils/errors.js";
import { uploadImage } from "../controllers/uploadController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only image files are allowed"), false);
    }
  },
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  console.error("Multer error caught:", {
    name: err.name,
    code: err.code,
    message: err.message,
    field: err.field,
    stack: err.stack,
  });

  // Handle multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 10MB limit",
        error: "File size exceeds the 10MB limit",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded",
        error: "Too many files uploaded",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field '${err.field}'. Expected field name: 'image'`,
        error: `Unexpected file field '${err.field}'. Expected field name: 'image'`,
      });
    }
    if (err.code === "LIMIT_PART_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many parts in the multipart request",
        error: "Too many parts in the multipart request",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
      error: err.message || "File upload error",
      code: err.code,
    });
  }
  
  // If it's a BadRequestError from fileFilter, handle it
  if (err instanceof BadRequestError || err.name === "BadRequestError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Bad request",
      error: err.message || "Bad request",
    });
  }
  
  // For other errors, pass to next error handler
  next(err);
};

// Upload image endpoint (requires authentication)
// POST /api/upload
// Body: FormData with 'image' file and optional 'imageType' field
// imageType options: 'category', 'admin_profile', 'customer_profile', 'artist_profile'
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    // Log request details before multer processes it
    console.log("Upload endpoint hit:", {
      method: req.method,
      contentType: req.headers["content-type"],
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {}),
    });
    next();
  },
  upload.single("image"),
  (err, req, res, next) => {
    // Handle multer errors immediately
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  },
  uploadImage
);

export default router;


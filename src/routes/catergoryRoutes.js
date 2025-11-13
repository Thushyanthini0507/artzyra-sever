/**
 * Category Routes
 * Public routes for viewing categories
 * Admin routes for category management
 */
import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getArtistsByCategory,
} from "../controllers/categoryController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes - View categories (no authentication required)
router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.get("/:categoryId/artists", getArtistsByCategory);

// Admin only routes - Category management
router.post("/", verifyToken, verifyRole("admin"), checkApproval, createCategory);
router.put("/:categoryId", verifyToken, verifyRole("admin"), checkApproval, updateCategory);
router.delete("/:categoryId", verifyToken, verifyRole("admin"), checkApproval, deleteCategory);

export default router;

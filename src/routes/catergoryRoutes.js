import express from "express";
const router = express.Router();
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getArtistsByCategory,
} from "../controllers/categoryController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// Public routes
router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.get("/:categoryId/artists", getArtistsByCategory);

// Admin only routes
router.post(
  "/",
  authenticate,
  checkApproval,
  restrictTo("admin"),
  createCategory
);
router.put(
  "/:categoryId",
  authenticate,
  checkApproval,
  restrictTo("admin"),
  updateCategory
);
router.delete(
  "/:categoryId",
  authenticate,
  checkApproval,
  restrictTo("admin"),
  deleteCategory
);

export default router;

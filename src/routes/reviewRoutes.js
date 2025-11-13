/**
 * Review Routes
 * Public routes for viewing reviews
 * Protected routes for creating and managing reviews
 */
import express from "express";
import {
  createReview,
  getReviewsByArtist,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes - View reviews (no authentication required)
router.get("/artist/:artistId", getReviewsByArtist);
router.get("/:reviewId", getReviewById);

// Protected routes - Create and manage reviews
router.post(
  "/",
  verifyToken,
  verifyRole("customer"),
  checkApproval,
  createReview
);

router.put(
  "/:reviewId",
  verifyToken,
  verifyRole("customer"),
  checkApproval,
  updateReview
);

// Delete review (customer or admin)
router.delete(
  "/:reviewId",
  verifyToken,
  verifyRole(["customer", "admin"]),
  checkApproval,
  deleteReview
);

export default router;

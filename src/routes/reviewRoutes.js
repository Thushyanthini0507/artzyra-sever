import express from "express";
const router = express.Router();
import {
  createReview,
  getReviewsByArtist,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// Public routes
router.get("/artist/:artistId", getReviewsByArtist);
router.get("/:reviewId", getReviewById);

// Protected routes
router.post(
  "/",
  authenticate,
  checkApproval,
  restrictTo("customer"),
  createReview
);
router.put(
  "/:reviewId",
  authenticate,
  checkApproval,
  restrictTo("customer"),
  updateReview
);
router.delete("/:reviewId", authenticate, checkApproval, deleteReview);

export default router;

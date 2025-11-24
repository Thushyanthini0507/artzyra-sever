/**
 * Artists Routes (Entity-based)
 * Routes for artist management, profile, bookings, reviews, and admin approval
 */
import express from "express";
import {
  getProfile,
  updateProfile,
  getBookings,
  acceptBooking,
  rejectBooking,
  getReviews,
  getPendingArtists,
  approveArtist,
  rejectArtist,
} from "../controllers/artistController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes - Get pending artists (for admin viewing)
router.get(
  "/pending",
  verifyToken,
  requireRole("admin"),
  checkApproval,
  getPendingArtists
);

// Admin routes - Artist approval/rejection
router.patch(
  "/:id/approve",
  verifyToken,
  requireRole("admin"),
  checkApproval,
  approveArtist
);
router.patch(
  "/:id/reject",
  verifyToken,
  requireRole("admin"),
  checkApproval,
  rejectArtist
);

// Artist-only routes - Profile management
router.get(
  "/profile",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  getProfile
);
router.put(
  "/profile",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  updateProfile
);

// Artist-only routes - Bookings
router.get(
  "/bookings",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  getBookings
);
router.put(
  "/bookings/:bookingId/accept",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  acceptBooking
);
router.put(
  "/bookings/:bookingId/reject",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  rejectBooking
);

// Artist-only routes - Reviews
router.get(
  "/reviews",
  verifyToken,
  requireRole("artist"),
  checkApproval,
  getReviews
);

export default router;

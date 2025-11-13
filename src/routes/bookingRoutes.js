/**
 * Booking Routes
 * Routes for booking management
 */
import express from "express";
import {
  createBooking,
  getBookingById,
  cancelBooking,
  completeBooking,
} from "../controllers/bookingController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All booking routes require authentication
router.use(verifyToken);
router.use(checkApproval);

// Create booking (customer only)
router.post("/", verifyRole("customer"), createBooking);

// Get booking by ID (customer, artist, admin)
router.get("/:bookingId", verifyRole(["customer", "artist", "admin"]), getBookingById);

// Cancel booking (customer only)
router.put("/:bookingId/cancel", verifyRole("customer"), cancelBooking);

// Complete booking (artist only)
router.put("/:bookingId/complete", verifyRole("artist"), completeBooking);

export default router;

import express from "express";
const router = express.Router();
import {
  createBooking,
  getBookingById,
  cancelBooking,
  completeBooking,
} from "../controllers/bookingController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All booking routes require authentication
router.use(authenticate);
router.use(checkApproval);

// Create booking (customer only)
router.post("/", restrictTo("customer"), createBooking);

// Get booking by ID (customer, artist, admin)
router.get("/:bookingId", getBookingById);

// Cancel booking (customer only)
router.put("/:bookingId/cancel", restrictTo("customer"), cancelBooking);

// Complete booking (artist only)
router.put("/:bookingId/complete", restrictTo("artist"), completeBooking);

export default router;

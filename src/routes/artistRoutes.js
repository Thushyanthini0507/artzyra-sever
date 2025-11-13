/**
 * Artist Routes
 * All routes require authentication and artist role
 */
import express from "express";
import {
  getProfile,
  updateProfile,
  getBookings,
  acceptBooking,
  rejectBooking,
  checkAvailability,
  getReviews,
} from "../controllers/artistController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All artist routes require authentication, approval, and artist role
router.use(verifyToken);
router.use(checkApproval);
router.use(verifyRole("artist"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/bookings", getBookings);
router.put("/bookings/:bookingId/accept", acceptBooking);
router.put("/bookings/:bookingId/reject", rejectBooking);
router.get("/availability", checkAvailability);
router.get("/reviews", getReviews);

export default router;

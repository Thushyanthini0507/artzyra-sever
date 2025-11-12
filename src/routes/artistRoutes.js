import express from "express";
const router = express.Router();
import {
  getProfile,
  updateProfile,
  getBookings,
  acceptBooking,
  rejectBooking,
  checkAvailability,
  getReviews,
} from "../controllers/artistController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All artist routes require authentication and artist role
router.use(authenticate);
router.use(checkApproval);
router.use(restrictTo("artist"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/bookings", getBookings);
router.put("/bookings/:bookingId/accept", acceptBooking);
router.put("/bookings/:bookingId/reject", rejectBooking);
router.get("/availability", checkAvailability);
router.get("/reviews", getReviews);

export default router;

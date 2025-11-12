import express from "express";
const router = express.Router();
import {
  getProfile,
  updateProfile,
  getBookings,
  getReviews,
} from "../controllers/customerController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All customer routes require authentication and customer role
router.use(authenticate);
router.use(checkApproval);
router.use(restrictTo("customer"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/bookings", getBookings);
router.get("/reviews", getReviews);

export default router;

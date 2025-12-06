/**
 * Admin Routes
 * All routes require authentication, approval, and admin role
 */
import express from "express";
import {
  getUsersByRole,
  getUserById,
  getAllBookings,
  getPendingArtists,
  getDashboardStatus,
  getProfile,
  updateProfile,
} from "../controllers/adminController.js";
import {
  approveArtist,
  rejectArtist,
} from "../controllers/artistController.js";
import { getPayments } from "../controllers/paymentController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All admin routes require authentication, approval, and admin role
router.use(verifyToken);
router.use(checkApproval);
router.use(verifyRole("admin"));

// Admin profile routes (admin can update their own profile)
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/users", getUsersByRole);
router.get("/users/:role/:userId", getUserById);
router.get("/pending/artists", getPendingArtists);
router.put("/artists/:id/approve", approveArtist);
router.put("/artists/:id/reject", rejectArtist);
router.get("/bookings", getAllBookings);
router.get("/payments", getPayments);
router.get("/dashboard/status", getDashboardStatus);

export default router;

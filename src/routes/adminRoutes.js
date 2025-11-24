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
} from "../controllers/adminController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All admin routes require authentication, approval, and admin role
router.use(verifyToken);
router.use(checkApproval);
router.use(verifyRole("admin"));

router.get("/users", getUsersByRole);
router.get("/users/:role/:userId", getUserById);
router.get("/pending/artists", getPendingArtists);
router.get("/bookings", getAllBookings);
router.get("/dashboard/status", getDashboardStatus);

export default router;

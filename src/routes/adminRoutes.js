/**
 * Admin Routes
 * All routes require authentication, approval, and admin role
 */
import express from "express";
import {
  approveUser,
  getUsersByRole,
  getUserById,
  getAllBookings,
  getDashboardStats,
} from "../controllers/adminController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All admin routes require authentication, approval, and admin role
router.use(verifyToken);
router.use(checkApproval);
router.use(verifyRole("admin"));

router.put("/users/approve", approveUser);
router.get("/users", getUsersByRole);
router.get("/users/:role/:userId", getUserById);
router.get("/bookings", getAllBookings);
router.get("/dashboard/stats", getDashboardStats);

export default router;

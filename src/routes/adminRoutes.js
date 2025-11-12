import express from "express";
const router = express.Router();
import {
  approveUser,
  getAllUsers,
  getUserById,
  getAllBookings,
  getDashboardStats,
} from "../controllers/adminController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(checkApproval);
router.use(restrictTo("admin"));

router.post("/users/approve", approveUser);
router.get("/users", getAllUsers);
router.get("/users/:role/:userId", getUserById);
router.get("/bookings", getAllBookings);
router.get("/dashboard/stats", getDashboardStats);

export default router;

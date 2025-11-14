/**
 * User Routes
 * Handles user registration, management, and profile retrieval
 */
import express from "express";
import {
  registerUser,
  getAllUsers,
  getProfile,
} from "../controllers/userController.js";
import { login, logout } from "../controllers/authController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";
import {
  // registerRateLimiter,
  authRateLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();
const userRoles = ["admin", "artist", "customer"];

// Public endpoints
router.post("/register",  registerUser);
router.post("/login", authRateLimiter, login);

// Admin-only user management
router.get("/", verifyToken, verifyRole("admin"), checkApproval, getAllUsers);

// Protected endpoints
router.get(
  "/profile",
  verifyToken,
  verifyRole(userRoles),
  checkApproval,
  getProfile
);
router.post(
  "/logout",
  verifyToken,
  verifyRole(userRoles),
  checkApproval,
  logout
);

export default router;

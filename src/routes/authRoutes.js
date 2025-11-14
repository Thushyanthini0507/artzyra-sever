/**
 * Authentication Routes
 * Public routes for login and session management
 * Protected routes for user profile management
 */
import express from "express";
import { login, getMe, logout } from "../controllers/authController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.post("/login", authRateLimiter, login);

const authenticatedRoles = ["admin", "artist", "customer"];

// Protected routes
router.get(
  "/me",
  verifyToken,
  verifyRole(authenticatedRoles),
  checkApproval,
  getMe
);
router.post(
  "/logout",
  verifyToken,
  verifyRole(authenticatedRoles),
  checkApproval,
  logout
);

export default router;

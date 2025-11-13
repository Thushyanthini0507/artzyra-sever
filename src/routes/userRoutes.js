/**
 * User Routes
 * Wrapper around authentication controller for user-focused endpoints
 */
import express from "express";
import {
  register,
  login,
  getMe as getProfile,
  logout,
} from "../controllers/authController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";
import {
  registerRateLimiter,
  authRateLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// Public endpoints
router.post("/register", registerRateLimiter, register);
router.post("/login", authRateLimiter, login);

const userRoles = ["admin", "artist", "customer"];

// Protected endpoints
router.get("/profile", verifyToken, verifyRole(userRoles), checkApproval, getProfile);
router.post("/logout", verifyToken, verifyRole(userRoles), checkApproval, logout);

export default router;



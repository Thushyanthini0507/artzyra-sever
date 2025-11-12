import express from "express";
const router = express.Router();
import {
  registerAdmin,
  registerArtist,
  registerCustomer,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";
import authenticate from "../middleware/authMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// Public routes
router.post("/register/admin", registerAdmin);
router.post("/register/artist", registerArtist);
router.post("/register/customer", registerCustomer);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, checkApproval, getMe);
router.post("/logout", authenticate, checkApproval, logout);

export default router;

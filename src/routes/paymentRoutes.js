/**
 * Payment Routes
 * Routes for payment processing and management
 */
import express from "express";
import {
  createPayment,
  getPaymentById,
  getPayments,
  refundPaymentRequest,
} from "../controllers/paymentController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All payment routes require authentication
router.use(verifyToken);
router.use(checkApproval);

// Create payment (customer only)
router.post("/", verifyRole("customer"), createPayment);

// Get payments (customer, artist, admin)
router.get("/", verifyRole(["customer", "artist", "admin"]), getPayments);

// Get payment by ID
router.get("/:paymentId", verifyRole(["customer", "artist", "admin"]), getPaymentById);

// Refund payment (admin only)
router.post("/:paymentId/refund", verifyRole("admin"), refundPaymentRequest);

export default router;

import express from "express";
const router = express.Router();
import {
  createPayment,
  getPaymentById,
  getPayments,
  refundPaymentRequest,
} from "../controllers/paymentController.js";
import authenticate from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/roleMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All payment routes require authentication
router.use(authenticate);
router.use(checkApproval);

// Create payment (customer only)
router.post("/", restrictTo("customer"), createPayment);

// Get payments (customer, artist, admin)
router.get("/", getPayments);

// Get payment by ID
router.get("/:paymentId", getPaymentById);

// Refund payment (admin only)
router.post("/:paymentId/refund", restrictTo("admin"), refundPaymentRequest);

export default router;

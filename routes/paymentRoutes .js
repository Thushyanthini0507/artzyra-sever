import express from "express";
import {
  createPayment,
  deletePayment,
  getAllPayment,
  getPaymentById,
  updatePayment,
} from "../controllers/paymentController.js";

const PaymentRouter = express.Router();

PaymentRouter.get("/", getAllPayment);
PaymentRouter.get("/:id", getPaymentById);
PaymentRouter.post("/", createPayment);
PaymentRouter.put("/:id", updatePayment);
PaymentRouter.delete("/:id", deletePayment);

export default PaymentRouter;

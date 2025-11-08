import express from "express";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.get("/", getAllCustomers);
reviewRouter.get("/:id", getCustomerById);
reviewRouter.post("/", createCustomer);
reviewRouter.put("/:id", updateCustomer);
reviewRouter.delete("/:id", deleteCustomer);

export default reviewRouter;

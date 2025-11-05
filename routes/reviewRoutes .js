import express from "express";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/reviewController.js";

const customerRouter = express.Router();

customerRouter.get("/", getAllCustomers);
customerRouter.get("/:id", getCustomerById);
customerRouter.post("/", createCustomer);
customerRouter.put("/:id", updateCustomer);
customerRouter.delete("/:id", deleteCustomer);

export default customerRouter;

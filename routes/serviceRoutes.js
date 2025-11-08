import express from "express";
import {
  createService,
  deleteService,
  getAllService,
  getServiceById,
  updateService,
} from "../controllers/serviceController.js";

const ServiceRouter = express.Router();

ServiceRouter.get("/", getAllService);
ServiceRouter.get("/:id", getServiceById);
ServiceRouter.post("/", createService);
ServiceRouter.put("/:id", updateService);
ServiceRouter.delete("/:id", deleteService);

export default ServiceRouter;

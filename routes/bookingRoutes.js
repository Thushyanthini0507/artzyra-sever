import express from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.get("/", getAllBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.post("/", createBooking);
bookingRouter.put("/:id", updateBooking);
bookingRouter.delete("/:id", deleteBooking);

export default bookingRouter;

import Booking from "../models/Booking.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import {
  calculateBookingAmount,
  isTimeSlotAvailable,
  createNotification,
} from "../utils/helpers.js";
import Notification from "../models/Notification.js";

// Create booking
const createBooking = async (req, res, next) => {
  try {
    const {
      artistId,
      categoryId,
      bookingDate,
      startTime,
      endTime,
      specialRequests,
      location,
    } = req.body;

    // Validate required fields
    if (!artistId || !categoryId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if artist exists and is approved
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    if (!artist.isApproved || !artist.isActive) {
      return res.status(400).json({
        success: false,
        message: "Artist is not available for booking",
      });
    }

    // Check availability
    const available = isTimeSlotAvailable(
      artist.availability,
      bookingDate,
      startTime,
      endTime
    );
    if (!available) {
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      artist: artistId,
      bookingDate: new Date(bookingDate),
      status: { $in: ["pending", "accepted"] },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gte: startTime },
        },
        {
          startTime: { $lte: endTime },
          endTime: { $gte: endTime },
        },
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Calculate duration and amount
    const start = new Date(`${bookingDate}T${startTime}`);
    const end = new Date(`${bookingDate}T${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60); // Convert to hours
    const totalAmount = calculateBookingAmount(artist.hourlyRate, duration);

    // Create booking
    const booking = await Booking.create({
      customer: req.userId,
      artist: artistId,
      category: categoryId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      duration,
      totalAmount,
      specialRequests,
      location,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email")
      .populate("artist", "name email")
      .populate("category", "name");

    // Create notification for artist
    await createNotification(
      Notification,
      artistId,
      "Artist",
      "booking_request",
      "New Booking Request",
      `You have a new booking request from ${req.user.name}`,
      booking._id,
      "Booking"
    );

    res.status(201).json({
      success: true,
      data: {
        booking: populatedBooking,
      },
      message: "Booking created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
const getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customer", "name email phone")
      .populate("artist", "name email phone profileImage rating")
      .populate("category", "name description");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    const isAuthorized =
      booking.customer._id.toString() === req.userId.toString() ||
      booking.artist._id.toString() === req.userId.toString() ||
      req.userRole === "admin";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this booking",
      });
    }

    res.json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization (customer can cancel their own bookings)
    if (
      booking.customer.toString() !== req.userId.toString() &&
      req.userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // Create notification for artist
    await createNotification(
      Notification,
      booking.artist,
      "Artist",
      "system",
      "Booking Cancelled",
      `A booking has been cancelled.`,
      booking._id,
      "Booking"
    );

    res.json({
      success: true,
      data: {
        booking,
      },
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Complete booking (for artist)
const completeBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.artist.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to complete this booking",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be completed",
      });
    }

    booking.status = "completed";
    await booking.save();

    // Create notification for customer
    await createNotification(
      Notification,
      booking.customer,
      "Customer",
      "booking_completed",
      "Booking Completed",
      `Your booking has been marked as completed. You can now leave a review.`,
      booking._id,
      "Booking"
    );

    res.json({
      success: true,
      data: {
        booking,
      },
      message: "Booking completed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { createBooking, getBookingById, cancelBooking, completeBooking };

import Booking from "../models/Booking.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import Artist from "../models/Artist.js";
import { createNotification } from "../utils/helpers.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../utils/errors.js";

/**
 * Create a new booking
 * @route POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    artistId,
    service,
    bookingDate,
    startTime,
    duration,
    location,
    notes,
    totalAmount,
  } = req.body;

  if (
    !artistId ||
    !service ||
    !bookingDate ||
    !startTime ||
    !duration ||
    !location ||
    totalAmount === undefined ||
    totalAmount === null
  ) {
    throw new BadRequestError("Please provide all required fields");
  }

  // Prevent booking with yourself
  if (req.userId.toString() === artistId) {
    throw new BadRequestError("You cannot book yourself");
  }

  // Find artist profile to check type and get delivery time
  const artistProfile = await Artist.findOne({ userId: artistId }).populate("category");
  
  if (!artistProfile) {
    throw new NotFoundError("Artist not found");
  }

  // Restrict bookings for physical artists
  if (artistProfile.artistType === "physical") {
    throw new BadRequestError("Bookings are not available for physical artists. Please contact them via chat.");
  }

  const booking = await Booking.create({
    customer: req.userId,
    artist: artistId,
    service,
    bookingDate,
    startTime,
    duration,
    location,
    notes,
    totalAmount,
    deliveryDays: artistProfile.deliveryTime, // Snapshot delivery time
    status: "pending",
    paymentStatus: "pending",
  });

  // Create notification for artist
  // Use artistProfile._id if found, otherwise fall back to artistId (though it might be wrong if it's userId)
  // Notification model expects Artist Profile ID when userModel is "Artist"
  const notificationTargetId = artistProfile ? artistProfile._id : artistId;

  await createNotification(
    Notification,
    notificationTargetId,
    "Artist",
    "new_booking",
    "New Booking Request",
    `You have a new booking request for ${service}`,
    booking._id,
    "Booking"
  );

  res.status(201).json({
    success: true,
    data: booking,
  });
});

/**
 * Get booking by ID
 * @route GET /api/bookings/:id
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("customer", "name email profileImage")
    .populate("artist", "name email profileImage category hourlyRate");

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Check authorization
  const isAuthorized =
    (booking.customer?._id && booking.customer._id.toString() === req.userId.toString()) ||
    (booking.artist?._id && booking.artist._id.toString() === req.userId.toString()) ||
    req.userRole === "admin";

  if (!isAuthorized) {
    throw new ForbiddenError("Not authorized to view this booking");
  }

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * Update booking status
 * @route PATCH /api/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Only artist can accept/decline, customer can cancel
  if (req.userRole === "artist" && booking.artist.toString() === req.userId.toString()) {
    if (!["confirmed", "declined", "completed"].includes(status)) {
       throw new BadRequestError("Invalid status update for artist");
    }
  } else if (req.userRole === "customer" && booking.customer.toString() === req.userId.toString()) {
    if (status !== "cancelled") {
      throw new BadRequestError("Customer can only cancel bookings");
    }
  } else if (req.userRole !== "admin") {
    throw new ForbiddenError("Not authorized to update this booking");
  }

  booking.status = status;
  await booking.save();

  // Notify the other party
  const recipientId =
    req.userId.toString() === booking.customer.toString()
      ? booking.artist
      : booking.customer;
  
  const recipientRole = 
    req.userId.toString() === booking.customer.toString()
      ? "Artist"
      : "Customer";

  await createNotification(
    Notification,
    recipientId,
    recipientRole,
    "booking_status",
    `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `Your booking status has been updated to ${status}`,
    booking._id,
    "Booking"
  );

  // If confirmed, create a chat channel
  if (status === "confirmed") {
    const existingChat = await Chat.findOne({ booking: booking._id });
    if (!existingChat) {
      await Chat.create({
        participants: [booking.customer, booking.artist],
        booking: booking._id,
        messages: [],
      });
    }
  }

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * Mark booking as completed
 * @route POST /api/bookings/:id/complete
 */
export const completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.artist.toString() !== req.userId.toString()) {
    throw new ForbiddenError("Only the artist can mark a booking as completed");
  }

  if (booking.status !== "confirmed") {
    throw new BadRequestError("Booking must be confirmed before completion");
  }

  booking.status = "completed";
  await booking.save();

  // Notify customer
  await createNotification(
    Notification,
    booking.customer,
    "Customer",
    "booking_completed",
    "Booking Completed",
    "Your booking has been marked as completed. Please confirm.",
    booking._id,
    "Booking"
  );

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * Get all bookings (with filters)
 * @route GET /api/bookings
 */
export const getBookings = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const query = {};

  if (req.userRole === "customer") {
    query.customer = req.userId;
  } else if (req.userRole === "artist") {
    query.artist = req.userId;
  } else if (req.userRole === "admin") {
    // Admin can filter by customer or artist if needed, implemented simply here
  } else {
    throw new ForbiddenError("Unauthorized");
  }

  if (status) {
    query.status = status;
  }

  const bookings = await Booking.find(query)
    .populate("customer", "name email")
    .populate("artist", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

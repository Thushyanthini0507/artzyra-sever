/**
 * Artist Controller
 * Handles artist profile management, bookings, reviews, and availability
 */
import Artist from "../models/Artist.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Category from "../models/Category.js";
import { isTimeSlotAvailable, createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Get artist profile
 * @route GET /api/artist/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.userId)
    .populate("category", "name description image")
    .select("-password");

  if (!artist) {
    throw new NotFoundError("Artist not found");
  }

  res.json({
    success: true,
    data: {
      artist,
    },
  });
});

/**
 * Update artist profile
 * @route PUT /api/artist/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    bio,
    category,
    skills,
    hourlyRate,
    availability,
    profileImage,
  } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (bio !== undefined) updateData.bio = bio;
  if (category) updateData.category = category;
  if (skills) updateData.skills = skills;
  if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
  if (availability) updateData.availability = availability;
  if (profileImage !== undefined) updateData.profileImage = profileImage;

  const artist = await Artist.findByIdAndUpdate(req.userId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name description image")
    .select("-password");

  if (!artist) {
    throw new NotFoundError("Artist not found");
  }

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      artist,
    },
  });
});

/**
 * Get artist bookings with pagination
 * @route GET /api/artist/bookings
 */
export const getBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { artist: req.userId };
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const bookings = await Booking.find(query)
    .populate("customer", "name email phone profileImage")
    .populate("category", "name description")
    .skip(skip)
    .limit(limitNum)
    .sort({ bookingDate: -1 });

  const total = await Booking.countDocuments(query);

  const response = formatPaginationResponse(bookings, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Accept booking
 * @route PUT /api/artist/bookings/:bookingId/accept
 */
export const acceptBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate("customer", "name email")
    .populate("artist", "name");

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Check authorization
  if (booking.artist._id.toString() !== req.userId.toString()) {
    throw new ForbiddenError("You are not authorized to accept this booking");
  }

  if (booking.status !== "pending") {
    throw new BadRequestError(`Booking is already ${booking.status}`);
  }

  booking.status = "accepted";
  await booking.save();

  // Create notification for customer
  await createNotification(
    Notification,
    booking.customer._id,
    "Customer",
    "booking_accepted",
    "Booking Accepted",
    `Your booking has been accepted by ${booking.artist.name}.`,
    booking._id,
    "Booking"
  );

  res.json({
    success: true,
    message: "Booking accepted successfully",
    data: {
      booking,
    },
  });
});

/**
 * Reject booking
 * @route PUT /api/artist/bookings/:bookingId/reject
 */
export const rejectBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("customer", "name email")
    .populate("artist", "name");

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Check authorization
  if (booking.artist._id.toString() !== req.userId.toString()) {
    throw new ForbiddenError("You are not authorized to reject this booking");
  }

  if (booking.status !== "pending") {
    throw new BadRequestError(`Booking is already ${booking.status}`);
  }

  booking.status = "rejected";
  await booking.save();

  // Create notification for customer
  await createNotification(
    Notification,
    booking.customer._id,
    "Customer",
    "booking_rejected",
    "Booking Rejected",
    `Your booking has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    booking._id,
    "Booking"
  );

  res.json({
    success: true,
    message: "Booking rejected successfully",
    data: {
      booking,
    },
  });
});

/**
 * Check availability
 * @route GET /api/artist/availability
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.query;

  if (!date || !startTime || !endTime) {
    throw new BadRequestError("Please provide date, startTime, and endTime");
  }

  const artist = await Artist.findById(req.userId);
  if (!artist) {
    throw new NotFoundError("Artist not found");
  }

  const isAvailable = isTimeSlotAvailable(
    artist.availability,
    date,
    startTime,
    endTime
  );

  // Check for existing bookings
  const existingBooking = await Booking.findOne({
    artist: req.userId,
    bookingDate: new Date(date),
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

  const available = isAvailable && !existingBooking;

  res.json({
    success: true,
    data: {
      available,
      message: available
        ? "Time slot is available"
        : "Time slot is not available",
    },
  });
});

/**
 * Get artist reviews with pagination
 * @route GET /api/artist/reviews
 */
export const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const reviews = await Review.find({
    artist: req.userId,
    isVisible: true,
  })
    .populate("customer", "name profileImage")
    .populate("booking", "bookingDate startTime endTime")
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({
    artist: req.userId,
    isVisible: true,
  });

  const response = formatPaginationResponse(reviews, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get all pending artists (admin only)
 * @route GET /api/artists/pending
 */
export const getPendingArtists = asyncHandler(async (req, res) => {
  const pendingArtists = await Artist.find({ isApproved: false })
    .select("-password")
    .populate("category", "name description");

  res.json({
    success: true,
    message: "Pending artists retrieved successfully",
    data: pendingArtists,
  });
});

/**
 * Approve artist (admin only)
 * @route PUT /api/artists/approve/:id
 */
export const approveArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await Artist.findById(id).select("-password");
  if (!artist) {
    throw new NotFoundError("Artist not found");
  }

  if (artist.isApproved) {
    return res.json({
      success: true,
      message: "Artist is already approved",
      data: artist,
    });
  }

  artist.isApproved = true;
  artist.isActive = true;
  await artist.save();

  res.json({
    success: true,
    message: "Artist approved successfully",
    data: artist,
  });
});

/**
 * Reject artist (admin only)
 * @route DELETE /api/artists/reject/:id
 */
export const rejectArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await Artist.findById(id);
  if (!artist) {
    throw new NotFoundError("Artist not found");
  }

  await artist.deleteOne();

  res.json({
    success: true,
    message: "Artist rejected and removed successfully",
  });
});

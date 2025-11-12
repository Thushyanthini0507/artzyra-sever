import Artist from "../models/Artist.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Category from "../models/Category.js";
import { isTimeSlotAvailable, createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";

// Get artist profile
const getProfile = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.userId)
      .populate("category", "name description")
      .select("-password");

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    res.json({
      success: true,
      data: {
        artist,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update artist profile
const updateProfile = async (req, res, next) => {
  try {
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
    if (bio) updateData.bio = bio;
    if (category) updateData.category = category;
    if (skills) updateData.skills = skills;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (availability) updateData.availability = availability;
    if (profileImage) updateData.profileImage = profileImage;

    const artist = await Artist.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: {
        artist,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get artist bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { artist: req.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(query)
      .populate("customer", "name email phone")
      .populate("category", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ bookingDate: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Accept booking
const acceptBooking = async (req, res, next) => {
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
        message: "You are not authorized to accept this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "accepted";
    await booking.save();

    // Create notification for customer
    await createNotification(
      Notification,
      booking.customer,
      "Customer",
      "booking_accepted",
      "Booking Accepted",
      `Your booking has been accepted by the artist.`,
      booking._id,
      "Booking"
    );

    res.json({
      success: true,
      data: {
        booking,
      },
      message: "Booking accepted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Reject booking
const rejectBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

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
        message: "You are not authorized to reject this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "rejected";
    await booking.save();

    // Create notification for customer
    await createNotification(
      Notification,
      booking.customer,
      "Customer",
      "booking_rejected",
      "Booking Rejected",
      `Your booking has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      booking._id,
      "Booking"
    );

    res.json({
      success: true,
      data: {
        booking,
      },
      message: "Booking rejected successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Check availability
const checkAvailability = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide date, startTime, and endTime",
      });
    }

    const artist = await Artist.findById(req.userId);
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
  } catch (error) {
    next(error);
  }
};

// Get artist reviews
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({ artist: req.userId, isVisible: true })
      .populate("customer", "name profileImage")
      .populate("booking", "bookingDate")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({
      artist: req.userId,
      isVisible: true,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getProfile,
  updateProfile,
  getBookings,
  acceptBooking,
  rejectBooking,
  checkAvailability,
  getReviews,
};

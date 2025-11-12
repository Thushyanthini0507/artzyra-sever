import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Artist from "../models/Artist.js";

// Get customer profile
const getProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update customer profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profileImage) updateData.profileImage = profileImage;

    const customer = await Customer.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: {
        customer,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get customer bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(query)
      .populate("artist", "name email phone profileImage rating")
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

// Get customer reviews
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({ customer: req.userId })
      .populate("artist", "name profileImage")
      .populate("booking", "bookingDate")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ customer: req.userId });

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

export { getProfile, updateProfile, getBookings, getReviews };

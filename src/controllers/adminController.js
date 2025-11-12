import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import { sendApprovalEmail } from "../utils/emailService.js";
import { createNotification } from "../utils/helpers.js";

// Approve/Reject User
const approveUser = async (req, res, next) => {
  try {
    const { userId, role, isApproved } = req.body;

    let User;
    if (role === "artist") {
      User = Artist;
    } else if (role === "customer") {
      User = Customer;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isApproved = isApproved;
    await user.save();

    // Send email notification
    await sendApprovalEmail(user.email, user.name, isApproved);

    // Create notification
    await createNotification(
      Notification,
      user._id,
      role === "artist" ? "Artist" : "Customer",
      "approval_status",
      isApproved ? "Account Approved" : "Account Approval Pending",
      isApproved
        ? "Your account has been approved. You can now log in."
        : "Your account approval is pending.",
      null,
      null
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isApproved: user.isApproved,
        },
      },
      message: `User ${isApproved ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (with filters)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isApproved, page = 1, limit = 10 } = req.query;

    let User;
    if (role === "artist") {
      User = Artist;
    } else if (role === "customer") {
      User = Customer;
    } else {
      return res.status(400).json({
        success: false,
        message: "Please specify a role (artist or customer)",
      });
    }

    const query = {};
    if (isApproved !== undefined) {
      query.isApproved = isApproved === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { userId, role } = req.params;

    let User;
    if (role === "artist") {
      User = Artist;
    } else if (role === "customer") {
      User = Customer;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(query)
      .populate("customer", "name email")
      .populate("artist", "name email")
      .populate("category", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

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

// Get dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const totalArtists = await Artist.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalArtists,
          totalCustomers,
          totalBookings,
          pendingBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  approveUser,
  getAllUsers,
  getUserById,
  getAllBookings,
  getDashboardStats,
};

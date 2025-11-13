/**
 * Admin Controller
 * Handles admin operations: user approval, user management, dashboard stats
 */
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
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Approve/Reject User
 * @route PUT /api/admin/users/approve
 */
export const approveUser = asyncHandler(async (req, res) => {
  const { userId, role, isApproved } = req.body;

  let User, userModel;
  if (role === "artist") {
    User = Artist;
    userModel = "Artist";
  } else {
    throw new BadRequestError("Invalid role. Must be artist or customer");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.isApproved = isApproved;
  await user.save();

  // Send email notification
  await sendApprovalEmail(user.email, user.name, isApproved);

  // Create notification
  await createNotification(
    Notification,
    user._id,
    userModel,
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
    message: `User ${isApproved ? "approved" : "rejected"} successfully`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
      },
    },
  });
});

/**
 * Get users by role with pagination (Admin only)
 * @route GET /api/admin/users
 */
export const getUsersByRole = asyncHandler(async (req, res) => {
  const { role, isApproved, page = 1, limit = 10 } = req.query;

  if (!role) {
    throw new BadRequestError("Please specify a role (artist or customer)");
  }

  let User;
  if (role === "artist") {
    User = Artist;
  } else if (role === "customer") {
    User = Customer;
  } else {
    throw new BadRequestError("Invalid role. Must be artist or customer");
  }

  const query = {};
  if (isApproved !== undefined) {
    query.isApproved = isApproved === "true";
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const users = await User.find(query)
    .select("-password")
    .populate("category", "name")
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  const response = formatPaginationResponse(users, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get user by ID (Admin only)
 * @route GET /api/admin/users/:role/:userId
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { userId, role } = req.params;

  let User;
  if (role === "artist") {
    User = Artist;
  } else if (role === "customer") {
    User = Customer;
  } else {
    throw new BadRequestError("Invalid role. Must be artist or customer");
  }

  const user = await User.findById(userId)
    .select("-password")
    .populate("category", "name description image");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * Get all bookings with pagination (Admin only)
 * @route GET /api/admin/bookings
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const bookings = await Booking.find(query)
    .populate("customer", "name email phone")
    .populate("artist", "name email phone profileImage rating")
    .populate("category", "name description")
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(query);

  const response = formatPaginationResponse(bookings, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get dashboard stats (Admin only)
 * @route GET /api/admin/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalArtists,
    totalCustomers,
    totalBookings,
    pendingBookings,
    totalRevenue,
    totalCategories,
    totalPayments,
    totalReviews,
  ] = await Promise.all([
    Artist.countDocuments(),
    Customer.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Category.countDocuments({ isActive: true }),
    Payment.countDocuments({ status: "completed" }),
    Review.countDocuments({ isVisible: true }),
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
        totalCategories,
        totalPayments,
        totalReviews,
      },
    },
  });
});

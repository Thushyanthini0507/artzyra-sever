/**
 * Admin Controller
 * Handles admin operations: user approval, user management, dashboard stats
 */

import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import PendingArtist from "../models/PendingArtist.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Get users by role with search and filtering (Admin only)
 * @route GET /api/admin/users
 * Query params: role, search, isApproved, isActive, category, minRating, maxHourlyRate, page, limit, sortBy, sortOrder
 *
 * EXPLANATION:
 * - role: REQUIRED - "artist" or "customer"
 * - search: Searches in name, email, bio (artists), skills (artists) - case-insensitive
 * - isApproved: Filter by approval status (true/false)
 * - isActive: Filter by active status (true/false)
 * - category: Filter artists by category ID
 * - minRating: Minimum rating for artists (0-5)
 * - maxHourlyRate: Maximum hourly rate for artists
 * - page, limit, sortBy, sortOrder: Pagination and sorting
 */
export const getUsersByRole = asyncHandler(async (req, res) => {
  const {
    role, // REQUIRED: "artist" or "customer"
    search, // Text search across multiple fields
    isApproved, // Approval status filter
    isActive, // Active status filter
    category, // Category filter (artists only)
    minRating, // Minimum rating (artists only)
    maxHourlyRate, // Maximum hourly rate (artists only)
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Validate required role parameter
  if (!role) {
    throw new BadRequestError("Please specify a role (artist or customer)");
  }

  // Determine which model to use based on role
  let ProfileModel;
  if (role === "artist") {
    ProfileModel = Artist;
  } else if (role === "customer") {
    ProfileModel = Customer;
  } else {
    throw new BadRequestError("Invalid role. Must be artist or customer");
  }

  // Start with empty query - will build filters
  const query = {};

  // SEARCH FILTER
  // Note: name and email are in User model, not in Artist/Customer models
  // We'll search in profile fields and then filter by user email if needed
  if (search) {
    if (role === "artist") {
      query.$or = [
        { bio: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }
    // For customers, we can search in address fields if needed
    // For now, we'll handle email search separately via User model
  }

  // STATUS FILTERS
  // For artists, use status field (pending/approved/rejected/suspended)
  // For customers, use isActive field
  if (role === "artist") {
  if (isApproved !== undefined) {
      // Map isApproved to status field for artists
      query.status = isApproved === "true" ? "approved" : { $ne: "approved" };
  }
  } else {
    // For customers, isActive is the status field
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
    }
  }

  // ARTIST-SPECIFIC FILTERS
  // Only apply these filters when role is "artist"
  if (role === "artist") {
    // Filter by category ID
    if (category) {
      query.category = category;
    }
    // Filter by minimum rating
    // $gte = greater than or equal to
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    // Filter by maximum hourly rate
    // $lte = less than or equal to
    if (maxHourlyRate) {
      query.hourlyRate = { $lte: parseFloat(maxHourlyRate) };
    }
  }

  // PAGINATION AND SORTING
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // EXECUTE QUERY
  // Only populate category for artists (customers don't have category field)
  let queryBuilder = ProfileModel.find(query);
  if (role === "artist") {
    queryBuilder = queryBuilder.populate("category", "name description image");
  }
  const profiles = await queryBuilder
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  // Get user emails for each profile
  const formattedUsers = await Promise.all(
    profiles.map(async (profile) => {
      const user = await User.findById(profile.userId).select("email");
      return {
        ...profile.toObject(),
        email: user?.email || "",
      };
    })
  );

  const total = await ProfileModel.countDocuments(query);

  const response = formatPaginationResponse(formattedUsers, total, page, limit);

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

  let ProfileModel;
  if (role === "artist") {
    ProfileModel = Artist;
  } else if (role === "customer") {
    ProfileModel = Customer;
  } else {
    throw new BadRequestError("Invalid role. Must be artist or customer");
  }

  const profile = await ProfileModel.findById(userId)
    .populate("category", "name description image");

  if (!profile) {
    throw new NotFoundError("User not found");
  }

  // Get user email from User collection
  const userDoc = await User.findById(profile.userId).select("email");

  res.json({
    success: true,
    data: {
      user: {
        ...profile.toObject(),
        email: userDoc?.email || "",
      },
    },
  });
});

/**
 * Get all bookings with search and filtering (Admin only)
 * @route GET /api/admin/bookings
 * Query params: search, status, paymentStatus, customer, artist, category, startDate, endDate, minAmount, maxAmount, page, limit, sortBy, sortOrder
 *
 * EXPLANATION:
 * Admin can see all bookings with comprehensive filtering options
 * - search: Searches in location and specialRequests
 * - status: Booking status filter
 * - paymentStatus: Payment status filter
 * - customer/artist/category: Filter by specific IDs
 * - startDate/endDate: Date range filter
 * - minAmount/maxAmount: Amount range filter
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    paymentStatus,
    customer,
    artist,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Start with empty query - admin can see all bookings
  const query = {};

  // STATUS FILTERS
  if (status) {
    query.status = status;
  }
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // USER FILTERS
  // Admin can filter by specific customer, artist, or category
  if (customer) {
    query.customer = customer;
  }
  if (artist) {
    query.artist = artist;
  }
  if (category) {
    query.category = category;
  }

  // DATE RANGE FILTER
  if (startDate || endDate) {
    query.bookingDate = {};
    if (startDate) {
      query.bookingDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.bookingDate.$lte = new Date(endDate);
    }
  }

  // AMOUNT RANGE FILTER
  if (minAmount || maxAmount) {
    query.totalAmount = {};
    if (minAmount) {
      query.totalAmount.$gte = parseFloat(minAmount);
    }
    if (maxAmount) {
      query.totalAmount.$lte = parseFloat(maxAmount);
    }
  }

  // SEARCH FILTER
  // Searches in location and specialRequests fields
  if (search) {
    query.$or = [
      { location: { $regex: search, $options: "i" } },
      { specialRequests: { $regex: search, $options: "i" } },
    ];
  }

  // PAGINATION AND SORTING
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const bookings = await Booking.find(query)
    .populate("customer", "profileImage")
    .populate("artist", "profileImage rating category")
    .populate("category", "name description")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  // Get user emails for customers and artists
  const formattedBookings = await Promise.all(
    bookings.map(async (booking) => {
      const bookingObj = booking.toObject();
      
      // Get customer user email
      if (bookingObj.customer?.userId) {
        const customerUser = await User.findById(bookingObj.customer.userId).select("email");
        bookingObj.customer.email = customerUser?.email || "";
      }
      
      // Get artist user email
      if (bookingObj.artist?.userId) {
        const artistUser = await User.findById(bookingObj.artist.userId).select("email");
        bookingObj.artist.email = artistUser?.email || "";
      }
      
      return bookingObj;
    })
  );

  const total = await Booking.countDocuments(query);

  const response = formatPaginationResponse(formattedBookings, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get pending artists (Admin only)
 * @route GET /api/admin/pending/artists
 * Query params: search, status, category, page, limit, sortBy, sortOrder
 */
export const getPendingArtists = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    category,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Status filter - default to pending if no status specified
  if (status) {
    query.status = status;
  } else {
    query.status = "pending";
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { bio: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const pendingArtists = await PendingArtist.find(query)
    .select("-password")
    .populate("category", "name description image")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await PendingArtist.countDocuments(query);

  const response = formatPaginationResponse(pendingArtists, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get admin profile
 * @route GET /api/admin/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const Admin = (await import("../models/Admin.js")).default;
  const User = (await import("../models/User.js")).default;
  
  // Get admin profile
  const admin = await Admin.findOne({ userId: req.userId });
  
  // Auto-create Admin profile if it doesn't exist
  if (!admin) {
    const newAdmin = await Admin.create({
      userId: req.userId,
      permissions: [],
    });
    
    // Get user data
    const user = await User.findById(req.userId).select("-password");
    
    return res.json({
      success: true,
      data: {
        user,
        admin: newAdmin,
      },
    });
  }
  
  // Get user data
  const user = await User.findById(req.userId).select("-password");
  
  res.json({
    success: true,
    data: {
      user,
      admin,
    },
  });
});

/**
 * Update admin profile
 * @route PUT /api/admin/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, permissions } = req.body;
  const Admin = (await import("../models/Admin.js")).default;
  const User = (await import("../models/User.js")).default;
  
  // Update Admin profile - name and phone are in Admin model, not User model
  const adminUpdateData = {};
  if (name) adminUpdateData.name = name;
  if (phone) adminUpdateData.phone = phone;
  if (permissions !== undefined) adminUpdateData.permissions = permissions;
  
  const admin = await Admin.findOneAndUpdate(
    { userId: req.userId },
    adminUpdateData,
    {
      new: true,
      runValidators: true,
      upsert: true, // Create if doesn't exist
    }
  );
  
  // Get updated user data
  const user = await User.findById(req.userId).select("-password");
  
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
      admin,
    },
  });
});

/**
 * Get dashboard stats (Admin only)
 * @route GET /api/admin/dashboard/stats
 */
export const getDashboardStatus = asyncHandler(async (req, res) => {
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

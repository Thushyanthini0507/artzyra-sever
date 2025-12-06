/**
 * Customer Controller
 * Handles customer profile management, bookings, and reviews
 */
import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import { NotFoundError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Get customer profile
 * @route GET /api/customers/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Find customer profile by userId (req.userId is the User ID)
  const customer = await Customer.findOne({ userId: req.userId }).select("-password");

  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  
  // Get user data
  const user = await User.findById(req.userId).select("-password");

  res.json({
    success: true,
    data: {
      user,
      customer,
    },
  });
});

/**
 * Update customer profile
 * @route PUT /api/customers/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, profileImage } = req.body;

  // Customer profile fields - name and phone are now in Customer model
  const customerUpdateData = {};
  if (name) customerUpdateData.name = name;
  if (phone) customerUpdateData.phone = phone;
  if (address) customerUpdateData.address = address;
  if (profileImage !== undefined) customerUpdateData.profileImage = profileImage;

  // Find customer profile by userId (req.userId is the User ID)
  const customer = await Customer.findOneAndUpdate(
    { userId: req.userId },
    customerUpdateData,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  
  // Get updated user data
  const user = await User.findById(req.userId).select("-password");

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
      customer,
    },
  });
});

/**
 * Get customer bookings with search and filtering
 * @route GET /api/customer/bookings
 * Query params: search, status, paymentStatus, artist, category, startDate, endDate, minAmount, maxAmount, page, limit, sortBy, sortOrder
 * 
 * EXPLANATION:
 * - search: Searches in location and specialRequests fields (case-insensitive)
 * - status: Filters by booking status (pending, accepted, rejected, completed, cancelled)
 * - paymentStatus: Filters by payment status (pending, paid, refunded)
 * - artist: Filters by artist ID
 * - category: Filters by category ID
 * - startDate/endDate: Date range filter for bookingDate (ISO format: YYYY-MM-DD)
 * - minAmount/maxAmount: Amount range filter for totalAmount
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Field to sort by (default: bookingDate)
 * - sortOrder: Sort direction - "asc" or "desc" (default: desc)
 */
export const getBookings = asyncHandler(async (req, res) => {
  // Extract query parameters from request
  const {
    search,           // Text search in location and specialRequests
    status,          // Booking status filter
    paymentStatus,   // Payment status filter
    artist,          // Artist ID filter
    category,        // Category ID filter
    startDate,       // Start date for date range
    endDate,         // End date for date range
    minAmount,       // Minimum booking amount
    maxAmount,       // Maximum booking amount
    page = 1,        // Current page number
    limit = 10,      // Items per page
    sortBy = "bookingDate",  // Field to sort by
    sortOrder = "desc",      // Sort direction
  } = req.query;

  // Start with base query - only get bookings for this customer
  const query = { customer: req.userId };

  // STATUS FILTERS
  // If status is provided, filter by booking status
  // Example: ?status=pending will only return pending bookings
  if (status) {
    query.status = status;
  }
  
  // If paymentStatus is provided, filter by payment status
  // Example: ?paymentStatus=paid will only return paid bookings
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // ARTIST AND CATEGORY FILTERS
  // Filter by specific artist ID
  // Example: ?artist=691aa51d3e6a1cca987f9223
  if (artist) {
    query.artist = artist;
  }
  
  // Filter by specific category ID
  // Example: ?category=69159852bcea8d9de167502f
  if (category) {
    query.category = category;
  }

  // DATE RANGE FILTER
  // Filter bookings within a date range
  // Example: ?startDate=2024-01-01&endDate=2024-12-31
  // Uses MongoDB $gte (greater than or equal) and $lte (less than or equal) operators
  if (startDate || endDate) {
    query.bookingDate = {};
    if (startDate) {
      // $gte means "greater than or equal to" - bookings on or after this date
      query.bookingDate.$gte = new Date(startDate);
    }
    if (endDate) {
      // $lte means "less than or equal to" - bookings on or before this date
      query.bookingDate.$lte = new Date(endDate);
    }
  }

  // AMOUNT RANGE FILTER
  // Filter bookings by total amount range
  // Example: ?minAmount=100&maxAmount=500
  // Uses MongoDB $gte and $lte operators for numeric comparison
  if (minAmount || maxAmount) {
    query.totalAmount = {};
    if (minAmount) {
      // Only bookings with amount >= minAmount
      query.totalAmount.$gte = parseFloat(minAmount);
    }
    if (maxAmount) {
      // Only bookings with amount <= maxAmount
      query.totalAmount.$lte = parseFloat(maxAmount);
    }
  }

  // SEARCH FILTER
  // Text search across multiple fields using MongoDB $or and $regex
  // Example: ?search=wedding
  // Searches in location and specialRequests fields (case-insensitive)
  // $regex with "i" option makes it case-insensitive
  // $or means "match any of these conditions"
  if (search) {
    query.$or = [
      { location: { $regex: search, $options: "i" } },
      { specialRequests: { $regex: search, $options: "i" } },
    ];
  }

  // PAGINATION CALCULATION
  // Calculate how many documents to skip based on page number
  // Example: page=2, limit=10 means skip first 10 items (show items 11-20)
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  
  // SORTING
  // Create sort object dynamically based on sortBy and sortOrder
  // Example: sortBy=bookingDate&sortOrder=asc
  // Results in: { bookingDate: 1 } (1 = ascending, -1 = descending)
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // EXECUTE QUERY
  // Find bookings matching the query, populate related data, apply pagination and sorting
  const bookings = await Booking.find(query)
    .populate("artist", "name email phone profileImage rating category")
    .populate("category", "name description")
    .skip(skip)      // Skip documents for pagination
    .limit(limitNum) // Limit number of results
    .sort(sort);     // Sort results

  // Get total count for pagination metadata
  const total = await Booking.countDocuments(query);

  // Format response with pagination info
  const response = formatPaginationResponse(bookings, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get customer reviews with search and filtering
 * @route GET /api/customer/reviews
 * Query params: search, artist, minRating, maxRating, startDate, endDate, page, limit, sortBy, sortOrder
 * 
 * EXPLANATION:
 * - search: Searches in comment field (case-insensitive)
 * - artist: Filters by artist ID
 * - minRating/maxRating: Rating range filter (1-5 stars)
 * - startDate/endDate: Date range filter for review creation date
 * - page, limit, sortBy, sortOrder: Pagination and sorting parameters
 */
export const getReviews = asyncHandler(async (req, res) => {
  const {
    search,           // Text search in comment
    artist,          // Artist ID filter
    minRating,       // Minimum rating (1-5)
    maxRating,       // Maximum rating (1-5)
    startDate,       // Start date for date range
    endDate,         // End date for date range
    page = 1,        // Current page number
    limit = 10,      // Items per page
    sortBy = "createdAt",  // Field to sort by
    sortOrder = "desc",     // Sort direction
  } = req.query;

  // Base query - only get reviews for this customer
  const query = { customer: req.userId };

  // ARTIST FILTER
  // Filter reviews by specific artist
  // Example: ?artist=691aa51d3e6a1cca987f9223
  if (artist) {
    query.artist = artist;
  }

  // RATING RANGE FILTER
  // Filter reviews by rating range
  // Example: ?minRating=4&maxRating=5 (only 4-5 star reviews)
  // Uses MongoDB $gte (>=) and $lte (<=) operators
  if (minRating || maxRating) {
    query.rating = {};
    if (minRating) {
      query.rating.$gte = parseInt(minRating); // Greater than or equal
    }
    if (maxRating) {
      query.rating.$lte = parseInt(maxRating); // Less than or equal
    }
  }

  // DATE RANGE FILTER
  // Filter reviews by creation date range
  // Example: ?startDate=2024-01-01&endDate=2024-12-31
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // SEARCH FILTER
  // Search in review comment field
  // Example: ?search=excellent
  // Uses regex for case-insensitive partial matching
  if (search) {
    query.comment = { $regex: search, $options: "i" };
  }

  // PAGINATION AND SORTING
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // EXECUTE QUERY
  const reviews = await Review.find(query)
    .populate("artist", "name profileImage category")
    .populate("booking", "bookingDate startTime endTime")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await Review.countDocuments(query);

  // Format response with pagination
  const response = formatPaginationResponse(reviews, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

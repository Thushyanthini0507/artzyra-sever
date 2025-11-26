/**
 * Artist Controller
 * Handles artist profile management, bookings, reviews, and availability
 */
import Artist from "../models/Artist.js";
import PendingArtist from "../models/PendingArtist.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Category from "../models/Category.js";
import { isTimeSlotAvailable, createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Get artist profile
 * @route GET /api/artist/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Find artist profile by userId (req.userId is the User ID)
  const artist = await Artist.findOne({ userId: req.userId })
    .populate("category", "name description image")
    .select("-password");

  if (!artist) {
    throw new NotFoundError("Artist");
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

  // Separate Artist profile fields from User fields
  const artistUpdateData = {};
  if (bio !== undefined) artistUpdateData.bio = bio;
  if (category) artistUpdateData.category = category;
  if (skills) artistUpdateData.skills = skills;
  if (hourlyRate !== undefined) artistUpdateData.hourlyRate = hourlyRate;
  if (availability) artistUpdateData.availability = availability;
  if (profileImage !== undefined) artistUpdateData.profileImage = profileImage;

  // Update User collection if name or phone changed (name and phone are in User, not Artist)
  if (name || phone) {
    const userUpdateData = {};
    if (name) userUpdateData.name = name;
    if (phone) userUpdateData.phone = phone;
    await User.findByIdAndUpdate(req.userId, userUpdateData, {
      runValidators: true,
    });
  }

  // Find artist profile by userId (req.userId is the User ID)
  const artist = await Artist.findOneAndUpdate(
    { userId: req.userId },
    artistUpdateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("category", "name description image")
    .select("-password");

  if (!artist) {
    throw new NotFoundError("Artist");
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
 * Get artist bookings with search and filtering
 * @route GET /api/artist/bookings
 * Query params: search, status, paymentStatus, category, startDate, endDate, minAmount, maxAmount, page, limit, sortBy, sortOrder
 * 
 * EXPLANATION:
 * Same filtering logic as customer bookings but filtered by artist ID instead of customer ID
 */
export const getBookings = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    paymentStatus,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
    sortBy = "bookingDate",
    sortOrder = "desc",
  } = req.query;

  // Find artist profile to get the artist ID
  const artistProfile = await Artist.findOne({ userId: req.userId });
  if (!artistProfile) {
    throw new NotFoundError("Artist");
  }

  // Base query - only get bookings for this artist (use Artist profile ID, not User ID)
  const query = { artist: artistProfile._id };

  // STATUS FILTERS
  if (status) {
    query.status = status;
  }
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
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
    .populate("customer", "name email phone profileImage")
    .populate("category", "name description")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

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

  // Get booking without populate first to check raw customer value
  const bookingRaw = await Booking.findById(bookingId);
  if (!bookingRaw) {
    throw new NotFoundError("Booking");
  }

  // Populate artist and customer
  const booking = await Booking.findById(bookingId)
    .populate("artist", "name")
    .populate("customer", "name email");

  if (!booking.artist) {
    throw new NotFoundError("Artist associated with this booking");
  }

  // Find artist profile to get the artist ID for authorization check
  const artistProfile = await Artist.findOne({ userId: req.userId });
  if (!artistProfile) {
    throw new NotFoundError("Artist");
  }

  // Check authorization (compare Artist profile ID, not User ID)
  if (booking.artist._id.toString() !== artistProfile._id.toString()) {
    throw new ForbiddenError("You are not authorized to accept this booking");
  }

  if (booking.status !== "pending") {
    throw new BadRequestError(`Booking is already ${booking.status}`);
  }

  // Handle customer reference - might be User ID or Customer profile ID
  let customerUserId = null;
  let customerName = "Customer";
  
  if (booking.customer && booking.customer._id) {
    // Customer was successfully populated (Customer profile ID was used)
    const customerProfile = await Customer.findById(booking.customer._id);
    if (customerProfile) {
      customerUserId = customerProfile.userId;
      customerName = booking.customer.name || "Customer";
    }
  } else {
    // Customer populate failed - booking.customer field contains User ID directly
    // Use the raw customer value from bookingRaw
    const user = await User.findById(bookingRaw.customer);
    if (user) {
      customerUserId = user._id;
      customerName = user.name || "Customer";
    } else {
      throw new NotFoundError("Customer associated with this booking");
    }
  }

  booking.status = "accepted";
  await booking.save();

  // Create notification for customer (use User ID)
  if (customerUserId) {
    await createNotification(
      Notification,
      customerUserId,
      "Customer",
      "booking_accepted",
      "Booking Accepted",
      `Your booking has been accepted by ${booking.artist.name}.`,
      booking._id,
      "Booking"
    );
  }

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

  // Get booking without populate first to check raw customer value
  const bookingRaw = await Booking.findById(bookingId);
  if (!bookingRaw) {
    throw new NotFoundError("Booking");
  }

  // Populate artist and customer
  const booking = await Booking.findById(bookingId)
    .populate("artist", "name")
    .populate("customer", "name email");

  if (!booking.artist) {
    throw new NotFoundError("Artist associated with this booking");
  }

  // Find artist profile to get the artist ID for authorization check
  const artistProfile = await Artist.findOne({ userId: req.userId });
  if (!artistProfile) {
    throw new NotFoundError("Artist");
  }

  // Check authorization (compare Artist profile ID, not User ID)
  if (booking.artist._id.toString() !== artistProfile._id.toString()) {
    throw new ForbiddenError("You are not authorized to reject this booking");
  }

  if (booking.status !== "pending") {
    throw new BadRequestError(`Booking is already ${booking.status}`);
  }

  // Handle customer reference - might be User ID or Customer profile ID
  let customerUserId = null;
  let customerName = "Customer";
  
  if (booking.customer && booking.customer._id) {
    // Customer was successfully populated (Customer profile ID was used)
    const customerProfile = await Customer.findById(booking.customer._id);
    if (customerProfile) {
      customerUserId = customerProfile.userId;
      customerName = booking.customer.name || "Customer";
    }
  } else {
    // Customer populate failed - booking.customer field contains User ID directly
    // Use the raw customer value from bookingRaw
    const user = await User.findById(bookingRaw.customer);
    if (user) {
      customerUserId = user._id;
      customerName = user.name || "Customer";
    } else {
      throw new NotFoundError("Customer associated with this booking");
    }
  }

  booking.status = "rejected";
  await booking.save();

  // Create notification for customer (use User ID)
  if (customerUserId) {
    await createNotification(
      Notification,
      customerUserId,
      "Customer",
      "booking_rejected",
      "Booking Rejected",
      `Your booking has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      booking._id,
      "Booking"
    );
  }

  res.json({
    success: true,
    message: "Booking rejected successfully",
    data: {
      booking,
    },
  });
});


/**
 * Get artist reviews with search and filtering
 * @route GET /api/artist/reviews
 * Query params: search, minRating, maxRating, startDate, endDate, page, limit, sortBy, sortOrder
 * 
 * EXPLANATION:
 * Filters reviews for the logged-in artist with rating and date range filters
 */
export const getReviews = asyncHandler(async (req, res) => {
  const {
    search,
    minRating,
    maxRating,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Find artist profile to get the artist ID
  const artistProfile = await Artist.findOne({ userId: req.userId });
  if (!artistProfile) {
    throw new NotFoundError("Artist");
  }

  // Base query - only visible reviews for this artist (use Artist profile ID, not User ID)
  const query = {
    artist: artistProfile._id,
    isVisible: true,
  };

  // RATING RANGE FILTER
  if (minRating || maxRating) {
    query.rating = {};
    if (minRating) {
      query.rating.$gte = parseInt(minRating);
    }
    if (maxRating) {
      query.rating.$lte = parseInt(maxRating);
    }
  }

  // DATE RANGE FILTER
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
  if (search) {
    query.comment = { $regex: search, $options: "i" };
  }

  // PAGINATION AND SORTING
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const reviews = await Review.find(query)
    .populate("customer", "name profileImage")
    .populate("booking", "bookingDate startTime endTime")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await Review.countDocuments(query);

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

  // Status filter
  if (status) {
    query.status = status;
  } else {
    // Default to pending if no status specified
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
    .populate("category", "name description")
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
 * Approve artist (admin only)
 * @route PUT /api/artists/approve/:id
 * Moves artist from PendingArtist to User + Artist collections
 */
export const approveArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find pending artist
  const pendingArtist = await PendingArtist.findById(id)
    .select("+password")
    .populate("category");
  
  if (!pendingArtist) {
    throw new NotFoundError("Pending artist");
  }

  if (pendingArtist.status === "approved") {
    return res.json({
      success: true,
      message: "Artist is already approved",
      data: pendingArtist,
    });
  }

  // Check if user already exists in Users collection
  const existingUser = await User.findOne({
    email: pendingArtist.email,
  });
  
  let user;
  let artist;
  
  if (existingUser) {
    // User already exists - check their role and profile
    if (existingUser.role !== "artist") {
      // User exists with different role (customer/admin)
      // This means they registered as customer first, then tried to register as artist
      // We should reject the pending artist and inform admin
      pendingArtist.status = "rejected";
      await pendingArtist.save();
      
      throw new ConflictError(
        `User with this email already exists as ${existingUser.role}. Cannot approve as artist. The pending artist registration has been rejected.`
      );
    }
    
    // User exists with artist role - check if they have an Artist profile
    const existingArtist = await Artist.findOne({ userId: existingUser._id });
    
    if (existingArtist) {
      // Artist already approved - this pending artist is a duplicate
      // Just update pending artist status and return success
      pendingArtist.status = "approved";
      await pendingArtist.save();
      await PendingArtist.findByIdAndDelete(id);
      
      const populatedArtist = await Artist.findById(existingArtist._id)
        .populate("category", "name description image");
      
      return res.json({
        success: true,
        message: "Artist is already approved. Duplicate pending registration removed.",
        data: {
          user: {
            id: existingUser._id,
            email: existingUser.email,
            role: existingUser.role,
            isActive: existingUser.isActive,
          },
          artist: populatedArtist,
        },
      });
    } else {
      // User exists with artist role but no Artist profile - create the profile
      // This handles edge case where User was created but Artist profile wasn't
      user = existingUser;
      
      // Create Artist profile from pending artist data
      artist = await Artist.create({
        userId: user._id,
        bio: pendingArtist.bio,
        profileImage: pendingArtist.profileImage,
        category: pendingArtist.category._id,
        skills: pendingArtist.skills,
        hourlyRate: pendingArtist.hourlyRate,
        availability: pendingArtist.availability,
        status: "approved",
        verifiedAt: new Date(),
      });
    }
  } else {
    // User doesn't exist - create new user and artist profile

    // Step 1: Create user in Users collection
    // User model only has: email, password, role, isActive
    // Password is already hashed in PendingArtist, so we need to bypass the pre-save hook
    user = await User.create({
      email: pendingArtist.email,
      password: "temp123", // Temporary - will be replaced with hashed password
      role: "artist",
      isActive: true,
    });

    // Update password directly to bypass pre-save hook (password is already hashed in PendingArtist)
    await User.updateOne(
      { _id: user._id },
      { $set: { password: pendingArtist.password } }
    );

    // Step 2: Create Artist profile
    artist = await Artist.create({
      userId: user._id,
      bio: pendingArtist.bio,
      profileImage: pendingArtist.profileImage,
      category: pendingArtist.category._id,
      skills: pendingArtist.skills,
      hourlyRate: pendingArtist.hourlyRate,
      availability: pendingArtist.availability,
      status: "approved",
      verifiedAt: new Date(),
    });
  }

  // Step 4: Update pending artist status and delete
  pendingArtist.status = "approved";
  await pendingArtist.save();
  await PendingArtist.findByIdAndDelete(id);

  // Populate artist with category for response
  const populatedArtist = await Artist.findById(artist._id)
    .populate("category", "name description image")
    .select("-password");

  res.json({
    success: true,
    message: "Artist approved successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      artist: populatedArtist,
    },
  });
});

/**
 * Reject artist (admin only)
 * @route DELETE /api/artists/reject/:id
 * Removes pending artist from PendingArtist collection
 */
export const rejectArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pendingArtist = await PendingArtist.findById(id);
  if (!pendingArtist) {
    throw new NotFoundError("Pending artist");
  }

  // Update status to rejected before deleting
  pendingArtist.status = "rejected";
  await pendingArtist.save();
  
  // Delete the pending artist
  await PendingArtist.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Artist rejected and removed successfully",
  });
});

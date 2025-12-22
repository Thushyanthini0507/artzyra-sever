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
import { sendApprovalEmail } from "../utils/emailService.js";
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
    .populate("category", "name description image type")
    .select("-password");

  if (!artist) {
    throw new NotFoundError("Artist");
  }

  // Sync artistType with category type if they don't match
  if (
    artist.category &&
    artist.category.type &&
    artist.artistType !== artist.category.type
  ) {
    artist.artistType = artist.category.type;
    await artist.save();
  }

  // Get user data
  const user = await User.findById(req.userId).select("-password");

  res.json({
    success: true,
    data: {
      user,
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
    portfolio,
    website,
    socialLinks,
    experience,
    education,
    certifications,
    languages,
    location,
    pricing,
    deliveryTime,
  } = req.body;

  // Import phone validation utilities
  const { normalizeSriLankanPhone, isValidSriLankanPhone } = await import(
    "../utils/phoneValidation.js"
  );

  // Separate Artist profile fields - name and phone are in Artist model, not User
  const artistUpdateData = {};
  if (name) artistUpdateData.name = name;
  if (phone) {
    // Validate and normalize phone number
    if (!isValidSriLankanPhone(phone)) {
      throw new BadRequestError(
        "Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)"
      );
    }
    artistUpdateData.phone = normalizeSriLankanPhone(phone);
  }
  if (bio !== undefined) artistUpdateData.bio = bio;
  if (category) {
    artistUpdateData.category = category;
    // Update artistType based on the new category type
    const categoryDoc = await Category.findById(category);
    if (categoryDoc && categoryDoc.type) {
      artistUpdateData.artistType = categoryDoc.type;
    }
  }
  if (skills) artistUpdateData.skills = skills;
  if (hourlyRate !== undefined) artistUpdateData.hourlyRate = hourlyRate;
  if (availability) artistUpdateData.availability = availability;
  if (profileImage !== undefined) artistUpdateData.profileImage = profileImage;
  if (portfolio !== undefined) artistUpdateData.portfolio = portfolio;
  if (website !== undefined) artistUpdateData.website = website;
  if (socialLinks !== undefined) artistUpdateData.socialLinks = socialLinks;
  if (experience !== undefined) artistUpdateData.experience = experience;
  if (education !== undefined) artistUpdateData.education = education;
  if (certifications !== undefined)
    artistUpdateData.certifications = certifications;
  if (languages !== undefined) artistUpdateData.languages = languages;
  if (location !== undefined) artistUpdateData.location = location;
  if (pricing !== undefined) artistUpdateData.pricing = pricing;
  if (deliveryTime !== undefined) artistUpdateData.deliveryTime = deliveryTime;

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

  // Get updated user data
  const user = await User.findById(req.userId).select("-password");

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
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
  console.log("getBookings called");
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

  try {
    console.log("Finding artist profile for userId:", req.userId);
    // Find artist profile to get the artist ID
    const artistProfile = await Artist.findOne({ userId: req.userId });
    if (!artistProfile) {
      console.log("Artist profile not found for userId:", req.userId);
      throw new NotFoundError("Artist");
    }
    console.log("Artist profile found:", artistProfile._id);

    // Base query - only get bookings for this artist (use User ID as per Booking schema)
    const query = { artist: req.userId };
    console.log("Initial query:", query);

    // STATUS FILTERS
    if (status && status !== "undefined" && status !== "null") {
      query.status = status;
    }
    if (
      paymentStatus &&
      paymentStatus !== "undefined" &&
      paymentStatus !== "null"
    ) {
      query.paymentStatus = paymentStatus;
    }

    // DATE RANGE FILTER
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        query.bookingDate.$gte = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        query.bookingDate.$lte = new Date(endDate);
      }
      // If object is empty, delete it
      if (Object.keys(query.bookingDate).length === 0) {
        delete query.bookingDate;
      }
    }

    // AMOUNT RANGE FILTER
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount && !isNaN(parseFloat(minAmount))) {
        query.totalAmount.$gte = parseFloat(minAmount);
      }
      if (maxAmount && !isNaN(parseFloat(maxAmount))) {
        query.totalAmount.$lte = parseFloat(maxAmount);
      }
      if (Object.keys(query.totalAmount).length === 0) {
        delete query.totalAmount;
      }
    }

    // SEARCH FILTER
    if (search && search.trim() !== "") {
      query.$or = [
        { location: { $regex: search, $options: "i" } },
        { specialRequests: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Final query:", JSON.stringify(query));

    // PAGINATION AND SORTING
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    console.log(
      "Executing Booking.find with sort:",
      sort,
      "skip:",
      skip,
      "limit:",
      limitNum
    );

    // Fetch bookings with customer User data
    const bookings = await Booking.find(query)
      .populate("customer", "email")
      .skip(skip)
      .limit(limitNum)
      .sort(sort)
      .lean(); // Use lean() for better performance

    console.log("Bookings found:", bookings.length);

    // Fetch Customer profiles for all customer IDs to get names
    const customerUserIds = bookings
      .map((b) => b.customer?._id || b.customer)
      .filter(Boolean);
    const customerProfiles = await Customer.find({
      userId: { $in: customerUserIds },
    })
      .select("userId name profileImage email")
      .lean();

    // Create a map of userId -> customer profile for quick lookup
    const customerMap = new Map();
    customerProfiles.forEach((profile) => {
      customerMap.set(profile.userId.toString(), profile);
    });

    // Merge customer profile data into bookings
    const bookingsWithCustomerData = bookings.map((booking) => {
      const customerUserId = booking.customer?._id || booking.customer;
      const customerProfile = customerUserId
        ? customerMap.get(customerUserId.toString())
        : null;

      return {
        ...booking,
        customer: {
          _id: customerUserId,
          email: booking.customer?.email || customerProfile?.email || "",
          name: customerProfile?.name || booking.customer?.name || "N/A",
          profileImage:
            customerProfile?.profileImage ||
            booking.customer?.profileImage ||
            "",
        },
      };
    });

    const total = await Booking.countDocuments(query);
    console.log("Total documents:", total);

    const response = formatPaginationResponse(
      bookingsWithCustomerData,
      total,
      pageNum,
      limitNum
    );

    res.json({
      success: true,
      data: response.data,
      pagination: response.pagination,
    });
  } catch (error) {
    console.error("Error in getBookings:", error);

    // If it's a known AppError, use its status code
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
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

  // Check authorization (compare User ID from booking with logged in User ID)
  if (booking.artist._id.toString() !== req.userId.toString()) {
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
    } else {
      // Fallback if customer is User
      customerUserId = booking.customer._id;
    }
  } else {
    // Customer populate failed - booking.customer field contains User ID directly
    // Use the raw customer value from bookingRaw
    const user = await User.findById(bookingRaw.customer);
    if (user) {
      customerUserId = user._id;
      // user.name doesn't exist, so default to "Customer"
      customerName = "Customer";
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
      `Your booking has been accepted by ${artistProfile.name}.`,
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
    .populate("artist", "email")
    .populate("customer", "email");

  if (!booking.artist) {
    throw new NotFoundError("Artist associated with this booking");
  }

  // Find artist profile to get the artist ID for authorization check
  const artistProfile = await Artist.findOne({ userId: req.userId });
  if (!artistProfile) {
    throw new NotFoundError("Artist");
  }

  // Check authorization (compare User ID from booking with logged in User ID)
  if (booking.artist._id.toString() !== req.userId.toString()) {
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

  // Validate ID format
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new BadRequestError("Invalid artist ID format");
  }

  // Find pending artist
  const pendingArtist = await PendingArtist.findById(id)
    .select("+password")
    .populate("category");

  if (!pendingArtist) {
    throw new NotFoundError("Pending artist not found with the provided ID");
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

      const populatedArtist = await Artist.findById(
        existingArtist._id
      ).populate("category", "name description image");

      return res.json({
        success: true,
        message:
          "Artist is already approved. Duplicate pending registration removed.",
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

      // Determine artist type from category
      const categoryDoc = await Category.findById(
        pendingArtist.category?._id || pendingArtist.category
      );
      const artistType = categoryDoc?.type || "physical"; // Default to physical if not found

      // Initialize subscription for physical artists
      const subscription = {
        status: artistType === "physical" ? "inactive" : "active", // Remote artists are active by default (no sub)
        plan: artistType === "physical" ? "standard" : "free",
      };

      // Create Artist profile from pending artist data
      try {
        artist = await Artist.create({
          userId: user._id,
          name: pendingArtist.name,
          bio: pendingArtist.bio,
          profileImage: pendingArtist.profileImage,
          category: pendingArtist.category?._id || pendingArtist.category,
          artistType,
          subscription,
          skills: pendingArtist.skills,
          hourlyRate: pendingArtist.hourlyRate,
          availability: pendingArtist.availability,
          services: pendingArtist.services || [],
          pricing: pendingArtist.pricing,
          deliveryTime: pendingArtist.deliveryTime,
          status: "approved",
          verifiedAt: new Date(),
        });
      } catch (error) {
        if (error.name === "ValidationError") {
          const validationErrors = Object.values(error.errors)
            .map((e) => e.message)
            .join(", ");
          throw new BadRequestError(`Validation failed: ${validationErrors}`);
        }
        throw error;
      }
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
    // Determine artist type from category
    const categoryId = pendingArtist.category?._id || pendingArtist.category;
    if (!categoryId) {
      throw new BadRequestError("Pending artist must have a valid category");
    }

    const categoryDoc = await Category.findById(categoryId);
    if (!categoryDoc) {
      throw new BadRequestError("Category not found for pending artist");
    }

    const artistType = categoryDoc.type || "physical"; // Default to physical if not found (fallback)

    // Initialize subscription for physical artists
    const subscription = {
      status: artistType === "physical" ? "inactive" : "active", // Remote artists are active by default (no sub)
      plan: artistType === "physical" ? "standard" : "free",
    };

    try {
      artist = await Artist.create({
        userId: user._id,
        name: pendingArtist.name,
        bio: pendingArtist.bio,
        profileImage: pendingArtist.profileImage,
        category: categoryId,
        artistType,
        subscription,
        skills: pendingArtist.skills,
        hourlyRate: pendingArtist.hourlyRate,
        availability: pendingArtist.availability,
        services: pendingArtist.services || [],
        pricing: pendingArtist.pricing,
        deliveryTime: pendingArtist.deliveryTime,
        status: "approved",
        verifiedAt: new Date(),
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
        throw new BadRequestError(`Validation failed: ${validationErrors}`);
      }
      throw error;
    }
  }

  // Step 4: Update pending artist status and delete
  pendingArtist.status = "approved";
  await pendingArtist.save();

  // Step 5: Send approval email notification to the artist
  let emailSent = false;
  let emailError = null;
  try {
    console.log(`Attempting to send approval email to: ${pendingArtist.email}`);
    const emailResult = await sendApprovalEmail(
      pendingArtist.email,
      pendingArtist.name || "Artist",
      true // isApproved = true
    );
    if (emailResult && emailResult.success) {
      emailSent = true;
      console.log(
        `✅ Approval email sent successfully to ${pendingArtist.email}`
      );
    } else {
      emailError = emailResult?.error || "Unknown error";
      console.warn(
        `⚠️ Failed to send approval email to ${pendingArtist.email}:`,
        emailError
      );
    }
  } catch (emailErr) {
    // Log error but don't fail the approval process
    emailError = emailErr.message || emailErr.toString();
    console.error(
      `❌ Error sending approval email to ${pendingArtist.email}:`,
      emailError
    );
  }

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
      emailNotification: {
        sent: emailSent,
        recipient: pendingArtist.email,
        error: emailError || null,
      },
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

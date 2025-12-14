/**
 * Authentication Controller
 * Handles login and registration using centralized Users collection
 */
import mongoose from "mongoose";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Artist from "../models/Artist.js";
import Admin from "../models/Admin.js";
import CategoryUser from "../models/CategoryUser.js";
import PendingArtist from "../models/PendingArtist.js";
import Category from "../models/Category.js";
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { generateToken } from "../config/jwt.js";

/**
 * Login
 * Uses Users collection for authentication
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError("Please provide a valid email address");
  }

  // Validate password is provided
  if (password.length < 1) {
    throw new BadRequestError("Password is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user in Users collection (include password for comparison)
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );

  // If user not found in Users, check pending tables (only for non-customer roles)
  if (!user) {
    // Check if user is in pending tables (only artists and other roles, not customers)
    const pendingArtist = await PendingArtist.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (pendingArtist) {
      throw new UnauthorizedError(
        "Your account is pending approval. Please wait for admin approval before logging in."
      );
    }

    // User doesn't exist in Users or pending tables
    throw new UnauthorizedError("Invalid email or password");
  }

  // If role is provided, validate it matches
  if (role && user.role !== role) {
    throw new UnauthorizedError(
      `Invalid role. This account is registered as ${user.role}`
    );
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Check if user is active
  if (user.isActive === false) {
    throw new UnauthorizedError(
      "Your account has been deactivated. Please contact support."
    );
  }

  // Get profile data from role-specific collection
  let profile = null;
  if (user.role === "customer") {
    profile = await Customer.findOne({ userId: user._id });
  } else if (user.role === "artist") {
    profile = await Artist.findOne({ userId: user._id })
      .populate("category", "name description");
  } else if (user.role === "admin") {
    profile = await Admin.findOne({ userId: user._id });
  } else if (user.profileType === "CategoryUser") {
    profile = await CategoryUser.findOne({ userId: user._id })
      .populate("category", "name description");
  }

  // Check if user is approved
  // Customers and admins are auto-approved and get instant access
  // Artists require admin approval - check Artist profile status
  if (user.role === "artist") {
    if (!profile || profile.status !== "approved") {
      throw new UnauthorizedError(
        "Your account is pending approval. Please wait for admin approval before logging in."
      );
    }
  } else if (user.role !== "admin" && user.role !== "customer") {
    // For other roles (CategoryUser, etc.), check if they have a profile
    if (!profile) {
      throw new UnauthorizedError(
        "Your account is pending approval. Please wait for admin approval before logging in."
      );
    }
  }

  // Generate token using user ID from Users collection
  const token = generateToken({ id: user._id, role: user.role });

  // Determine redirect path based on role
  let redirectPath = "/";
  switch (user.role) {
    case "customer":
      redirectPath = "/customer/dashboard";
      break;
    case "artist":
      redirectPath = "/artist/dashboard";
      break;
    case "admin":
      redirectPath = "/admin/dashboard";
      break;
    case "category":
      redirectPath = "/category/dashboard";
      break;
    default:
      redirectPath = "/";
  }

  // Build user response object
  const userResponse = {
    id: user._id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  // Add profile-specific fields
  if (profile) {
    if (user.role === "artist") {
      userResponse.name = profile.name;
      userResponse.isApproved = profile.status === "approved";
      userResponse.status = profile.status;
    } else if (user.role === "customer") {
      userResponse.name = profile.name;
      userResponse.isApproved = true; // Customers are auto-approved
    }
  }

  // Set cookie with token
  // Localhost: secure: false, sameSite: "lax"
  // Production: secure: true, sameSite: "none"
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    secure: isProduction, // true in production (HTTPS), false in development (HTTP)
    sameSite: isProduction ? "none" : "lax", // "none" for production (cross-site), "lax" for localhost
  };

  res.cookie("token", token, cookieOptions);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: userResponse,
      profile,
      token, // Still return token for backward compatibility
      redirectPath, // Role-based redirection path for frontend
    },
  });
});

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by authenticate middleware
  // Get full profile data - don't populate category on User model (it doesn't exist there)
  const user = await User.findById(req.userId)
    .select("-password");

  // Get profile from role-specific collection based on user.role (not profileType)
  let profile = null;
  if (user.role === "customer") {
    profile = await Customer.findOne({ userId: user._id });
  } else if (user.role === "artist") {
    profile = await Artist.findOne({ userId: user._id })
      .populate("category", "name description");
  } else if (user.role === "admin") {
    profile = await Admin.findOne({ userId: user._id });
    // Auto-create Admin profile if it doesn't exist
    if (!profile) {
      profile = await Admin.create({
        userId: user._id,
        permissions: [],
      });
    }
  } else if (user.role === "category") {
    profile = await CategoryUser.findOne({ userId: user._id })
      .populate("category", "name description");
  }

  res.json({
    success: true,
    data: {
      user,
      profile,
    },
  });
});

export const getProfile = getMe;

/**
 * Logout
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear the token cookie
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    maxAge: 0, // Immediately expire
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("token", "", cookieOptions);

  res.json({
    success: true,
    message: "Logout successful",
    data: {
      userId: req.userId,
      role: req.userRole,
    },
  });
});

/**
 * Register Customer
 * Customers get instant access (no approval needed)
 * @route POST /api/auth/register/customer
 */
export const registerCustomer = asyncHandler(async (req, res) => {
  const { email, password, name, phone, address, profileImage } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError("Please provide a valid email address");
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists in Users collection
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Step 1: Create user in Users collection (auto-approved)
  const user = await User.create({
    email: normalizedEmail,
    password, // Will be hashed by pre-save hook
    role: "customer",
    isActive: true,
  });

  // Step 2: Create Customer profile
  // Validate and normalize phone number if provided
  let normalizedPhone = "";
  if (phone) {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");
    
    // Basic phone validation: must be between 7 and 15 digits (international standard)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new BadRequestError("Please provide a valid phone number (7-15 digits)");
    }
    
    // Try to normalize as Sri Lankan phone if it matches the format, otherwise use as-is
    const { normalizeSriLankanPhone, isValidSriLankanPhone } = await import("../utils/phoneValidation.js");
    if (isValidSriLankanPhone(phone)) {
    normalizedPhone = normalizeSriLankanPhone(phone);
    } else {
      // Accept any valid phone number format (just remove non-digits)
      normalizedPhone = digitsOnly;
    }
  }

  const customer = await Customer.create({
    userId: user._id,
    name: name || "",
    phone: normalizedPhone,
    address: address || {},
    profileImage: profileImage || "",
    isActive: true,
  });

  // Step 4: Generate token for immediate access
  const token = generateToken({ id: user._id, role: user.role });

  // Set cookie with token
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("token", token, cookieOptions);

  return res.status(201).json({
    success: true,
    message: "Customer registered successfully. You can now log in.",
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profileId: customer._id,
      },
      token, // Return token for backward compatibility
      redirectPath: "/customer/dashboard", // Role-based redirection path
    },
  });
});

/**
 * Register Artist
 * Artists are saved to pending table (requires admin approval)
 * @route POST /api/auth/register/artist
 */
export const registerArtist = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    bio,
    category,
    skills,
    hourlyRate,
    availability,
    profileImage,
  } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  // Validate category
  if (!category) {
    throw new BadRequestError(
      "Category is required for artist registration. Please select a valid category from the dropdown."
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError("Please provide a valid email address");
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists in Users collection
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Check if email exists in pending artists
  const existingPending = await PendingArtist.findOne({
    email: normalizedEmail,
  });
  if (existingPending) {
    throw new ConflictError(
      "Registration request already pending. Please wait for admin approval."
    );
  }

  // Find category by ID or name
  let categoryId = null;
  if (mongoose.Types.ObjectId.isValid(category)) {
    categoryId = category;
  } else {
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") },
    });
    if (!categoryDoc) {
      throw new NotFoundError(
        `Category not found. Provide a valid category id or name.`
      );
    }
    categoryId = categoryDoc._id;
  }

  // Verify category exists
  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    // Get all available categories for helpful error message
    const availableCategories = await Category.find({ isActive: true }).select('name');
    const categoryNames = availableCategories.map(c => c.name).join(', ');
    
    throw new BadRequestError(
      `Invalid category provided. Received: "${category}". Available categories: ${categoryNames}`
    );
  }

  // Handle availability - convert string to proper format for Mongoose Map
  // CRITICAL: Mongoose Map type requires a plain object, NOT a string
  // We MUST convert strings to objects before passing to Mongoose.create()
  let availabilityData = {};
  
  // Always process availability to ensure it's never a string when passed to Mongoose
  if (availability !== undefined && availability !== null) {
    const availabilityType = typeof availability;
    
    if (availabilityType === "string") {
      // String format: "Available for part-time and project-based work"
      // Convert to default weekday schedule (Monday-Friday, 9 AM - 6 PM)
      // Mongoose will convert this plain object to a Map automatically
      availabilityData = {
        monday: { start: "09:00", end: "18:00", available: true },
        tuesday: { start: "09:00", end: "18:00", available: true },
        wednesday: { start: "09:00", end: "18:00", available: true },
        thursday: { start: "09:00", end: "18:00", available: true },
        friday: { start: "09:00", end: "18:00", available: true },
        saturday: { start: "09:00", end: "18:00", available: false },
        sunday: { start: "09:00", end: "18:00", available: false },
      };
    } else if (availabilityType === "object") {
      // Object format: { "monday": { "start": "09:00", "end": "18:00", "available": true }, ... }
      if (availability instanceof Map) {
        // Convert Map to plain object
        availabilityData = Object.fromEntries(availability);
      } else if (availability !== null && !Array.isArray(availability)) {
        // Use the plain object directly (validate structure)
        // Ensure it's a valid object with proper structure
        const validAvailability = {};
        for (const [key, value] of Object.entries(availability)) {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            validAvailability[key] = value;
          }
        }
        availabilityData = Object.keys(validAvailability).length > 0 ? validAvailability : {};
      }
    }
    // If availability is empty string, null, array, or invalid, use empty object (default)
  }
  
  // Final safety check: ensure availabilityData is always an object, never a string
  if (typeof availabilityData === "string") {
    availabilityData = {};
  }

  // Process skills - convert string to array if needed
  let skillsArray = [];
  if (skills) {
    if (typeof skills === "string") {
      // Split comma-separated string and trim each skill
      skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => (typeof s === "string" ? s.trim() : s)).filter((s) => s);
    }
  }

  // Process hourlyRate - convert string to number if needed
  let hourlyRateNum = 0;
  if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== "") {
    hourlyRateNum = typeof hourlyRate === "string" ? parseFloat(hourlyRate) : Number(hourlyRate);
    if (isNaN(hourlyRateNum) || hourlyRateNum < 0) {
      hourlyRateNum = 0;
    }
  }

  // Process pricing
  let pricingData = {
    amount: hourlyRateNum,
    unit: "hour", // Default for backward compatibility
    currency: "LKR"
  };

  if (req.body.pricing) {
    pricingData = { ...pricingData, ...req.body.pricing };
  }

  // Create pending artist (password will be hashed by pre-save hook)
  // Mongoose will automatically convert the plain object to a Map for the availability field
  const pendingArtist = await PendingArtist.create({
    name: name?.trim() || "",
    email: normalizedEmail,
    password, // Will be hashed by pre-save hook
    phone: phone?.trim() || "",
    bio: bio || "",
    profileImage: profileImage || "",
    category: categoryId,
    skills: skillsArray,
    hourlyRate: hourlyRateNum,
    availability: availabilityData,
    pricing: pricingData,
    deliveryTime: req.body.deliveryTime,
    status: "pending",
  });

  return res.status(201).json({
    success: true,
    message:
      "Artist registration submitted successfully. Please wait for admin approval.",
    data: {
      pendingId: pendingArtist._id,
      name: pendingArtist.name,
      email: pendingArtist.email,
      status: pendingArtist.status,
    },
  });
});

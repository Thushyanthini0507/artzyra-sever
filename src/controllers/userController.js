/**
 * User Controller
 * Handles registration with centralized Users collection
 * Flow: 
 * - Customers: Direct to Users table (instant access, no approval needed)
 * - Artists: Save to pending table → Admin approves → Move to Users + profile
 * - Category users: Create User in Users collection → Then create role-specific profile
 */
import mongoose from "mongoose";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import CategoryUser from "../models/CategoryUser.js";
import PendingArtist from "../models/PendingArtist.js";
import Category from "../models/Category.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { generateToken } from "../config/jwt.js";

/**
 * Register a new user
 * - Customers: Direct to Users table (instant access, no approval)
 * - Artists: Save to pending table (requires admin approval)
 * - Category users: Create User in Users collection → Then create profile
 * @route POST /api/users/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const {
    role,
    name,
    email,
    password,
    phone,
    // Customer fields
    address,
    // Artist fields
    bio,
    category,
    skills,
    hourlyRate,
    availability,
    // Category user fields
    categoryName,
    subCategory,
    experience,
    portfolio,
  } = req.body;

  // Validate required fields
  if (!role || !name || !email || !password) {
    throw new BadRequestError("Please provide role, name, email, and password");
  }

  // Validate role
  const validRoles = ["customer", "artist", "admin", "category"];
  if (!validRoles.includes(role)) {
    throw new BadRequestError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`
    );
  }

  // Admin cannot self-register
  if (role === "admin") {
    throw new BadRequestError("Admin accounts cannot be self-registered.");
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

  // Validate name (minimum 2 characters)
  if (name.trim().length < 2) {
    throw new BadRequestError("Name must be at least 2 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists in Users collection
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Handle CUSTOMER registration - Instant access (no approval needed)
  if (role === "customer") {
    // Step 1: Create user in Users collection (auto-approved)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Will be hashed by pre-save hook
      phone: phone?.trim(),
      role: "customer",
      isApproved: true, // Customers are auto-approved
      isActive: true,
    });

    // Validate and normalize phone number if provided
    let normalizedPhone = "";
    if (phone) {
      const { normalizeSriLankanPhone, isValidSriLankanPhone } = await import("../utils/phoneValidation.js");
      if (!isValidSriLankanPhone(phone)) {
        throw new BadRequestError("Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)");
      }
      normalizedPhone = normalizeSriLankanPhone(phone);
    }

    // Step 2: Create Customer profile
    const customer = await Customer.create({
      userId: user._id,
      name: name || "",
      phone: normalizedPhone,
      address,
      profileImage: req.body.profileImage || "",
      isApproved: true,
      isActive: true,
    });

    // Step 3: Link User to Customer profile
    user.profileRef = customer._id;
    user.profileType = "Customer";
    await user.save();

    // Step 4: Generate token for immediate access
    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully. You can now log in.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          profileId: customer._id,
        },
        token, // Return token for immediate access
        redirectPath: "/customer/dashboard", // Role-based redirection path
      },
    });
  }

  // Handle ARTIST registration - Save to pending table
  if (role === "artist") {
    // Validate category
    if (!category) {
      throw new BadRequestError("Category is required for artist registration");
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
      throw new BadRequestError("Invalid category provided");
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

    // Validate and normalize phone number if provided
    let normalizedPhone = "";
    if (phone) {
      const { normalizeSriLankanPhone, isValidSriLankanPhone } = await import("../utils/phoneValidation.js");
      if (!isValidSriLankanPhone(phone)) {
        throw new BadRequestError("Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)");
      }
      normalizedPhone = normalizeSriLankanPhone(phone);
    }

    // Create pending artist (password will be hashed by pre-save hook)
    const pendingArtist = await PendingArtist.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Will be hashed by pre-save hook
      phone: normalizedPhone,
      bio,
      profileImage: req.body.profileImage || "",
      category: categoryId,
      skills: skills || [],
      hourlyRate: hourlyRate || 0,
      availability: availability || {},
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
  }

  // Handle CATEGORY USER registration - Keep existing flow (direct to Users)
  if (role === "category") {
    // Handle category
    if (!category) {
      throw new BadRequestError(
        "Category is required for category user registration"
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
      throw new BadRequestError("Invalid category provided");
    }

    // Create user in Users collection
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Will be hashed by pre-save hook
      phone: phone?.trim(),
      role,
      category: categoryId,
      isApproved: false, // Category users need approval
      isActive: true,
    });

    // Get category name if not provided
    const categoryDoc = await Category.findById(categoryId);
    const finalCategoryName = categoryName || categoryDoc?.name || "";

    // Create profile
    const profile = await CategoryUser.create({
      userId: user._id,
      categoryName: finalCategoryName,
      category: categoryId,
      subCategory,
      skills: skills || [],
      hourlyRate: hourlyRate || 0,
      experience: experience || { years: 0, description: "" },
      portfolio: portfolio || [],
      availability: availability || {},
      isApproved: false,
      isActive: true,
    });

    // Link User to profile
    user.profileRef = profile._id;
    user.profileType = "CategoryUser";
    await user.save();

    return res.status(201).json({
      success: true,
      message:
        "Category user registered successfully. Please wait for admin approval.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          profileId: profile._id,
        },
      },
    });
  }
});

/**
 * Get all users with search and filtering
 * @route GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    search,
    role,
    isApproved,
    isActive,
    category,
    minRating,
    maxHourlyRate,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Role filter
  if (role) {
    query.role = role;
  }

  // Status filters
  if (isApproved !== undefined) {
    query.isApproved = isApproved === "true";
  }
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
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
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Get users from Users collection
  const users = await User.find(query)
    .select("-password")
    .populate("category", "name description")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await User.countDocuments(query);

  // Populate profile data based on profileType
  const usersWithProfiles = await Promise.all(
    users.map(async (user) => {
      let profileData = null;

      if (user.profileType === "Customer") {
        profileData = await Customer.findOne({ userId: user._id });
      } else if (user.profileType === "Artist") {
        profileData = await Artist.findOne({ userId: user._id })
          .populate("category", "name description");
      } else if (user.profileType === "CategoryUser") {
        profileData = await CategoryUser.findOne({ userId: user._id })
          .populate("category", "name description");
      } else if (user.profileType === "Admin") {
        profileData = await Admin.findOne({ userId: user._id });
      }

      return {
        ...user.toObject(),
        profile: profileData,
      };
    })
  );

  res.json({
    success: true,
    message: "Users retrieved successfully",
    data: usersWithProfiles,
    pagination: {
      currentPage: parseInt(page),
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: skip + users.length < total,
      hasPrevPage: parseInt(page) > 1,
    },
  });
});

/**
 * Get currently authenticated user profile
 * @route GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

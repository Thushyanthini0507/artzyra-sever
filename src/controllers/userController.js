/**
 * User Controller
 * Handles registration, user listings, and profile retrieval
 */
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import Category from "../models/Category.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";

/**
 * Register a new user (artist or customer)
 * @route POST /api/users/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const {
    role,
    name,
    email,
    password,
    phone,
    bio,
    category,
    skills,
    hourlyRate,
    address,
  } = req.body;

  if (!role || !name || !email || !password) {
    throw new BadRequestError("Please provide role, name, email, and password");
  }

  if (role === "admin") {
    throw new BadRequestError("Admin accounts cannot be self-registered.");
  }

  if (role !== "artist" && role !== "customer") {
    throw new BadRequestError(
      "Invalid role. Only 'artist' and 'customer' roles are allowed."
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists across all collections
  const [existingAdmin, existingArtist, existingCustomer] = await Promise.all([
    Admin.findOne({ email: normalizedEmail }),
    Artist.findOne({ email: normalizedEmail }),
    Customer.findOne({ email: normalizedEmail }),
  ]);

  if (existingAdmin || existingArtist || existingCustomer) {
    throw new ConflictError("User with this email already exists");
  }

  if (role === "artist") {
    if (!category) {
      throw new BadRequestError("Category is required for artist registration");
    }

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

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      throw new BadRequestError("Invalid category provided for artist");
    }

    const artist = await Artist.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone,
      bio,
      category: categoryId,
      skills,
      hourlyRate,
    });

    return res.status(201).json({
      success: true,
      message:
        "Artist registered successfully. Please wait for admin approval.",
      data: {
        user: {
          id: artist._id,
          name: artist.name,
          email: artist.email,
          role: artist.role,
          isApproved: artist.isApproved,
        },
      },
    });
  }

  const customer = await Customer.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone,
    address,
  });

  return res.status(201).json({
    success: true,
    message:
      "Customer registered successfully. Please wait for admin approval.",
    data: {
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        isApproved: customer.isApproved,
      },
    },
  });
});

/**
 * Get all non-admin users
 * @route GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const [artists, customers] = await Promise.all([
    Artist.find().select("-password"),
    Customer.find().select("-password"),
  ]);

  const users = [
    ...artists.map((artist) => ({
      ...artist.toObject(),
      role: "artist",
    })),
    ...customers.map((customer) => ({
      ...customer.toObject(),
      role: "customer",
    })),
  ];

  res.json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
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

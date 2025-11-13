/**
 * Authentication Controller
 * Handles login and authentication for all user types
 */
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import Category from "../models/Category.js";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";

/**
 * Register user (artist or customer)
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
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

    if (!Category || !(await Category.findById(category))) {
      throw new BadRequestError("Invalid category provided for artist");
    }

    const artist = await Artist.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone,
      bio,
      category,
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
 * Login
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Validate required fields
  if (!email || !password || !role) {
    throw new BadRequestError("Please provide email, password, and role");
  }

  // Determine user model based on role
  let User, userRole;
  if (role === "admin") {
    User = Admin;
    userRole = "admin";
  } else if (role === "artist") {
    User = Artist;
    userRole = "artist";
  } else if (role === "customer") {
    User = Customer;
    userRole = "customer";
  } else {
    throw new BadRequestError(
      "Invalid role. Must be admin, artist, or customer"
    );
  }

  // Find user and include password for comparison
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Check if user is approved (admins are always approved)
  if (userRole !== "admin" && !user.isApproved) {
    throw new UnauthorizedError(
      "Your account is pending approval. Please wait for admin approval."
    );
  }

  // Check if user is active
  if (user.isActive === false) {
    throw new UnauthorizedError(
      "Your account has been deactivated. Please contact support."
    );
  }

  // Generate token
  const token = user.getSignedJwtToken();

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        isApproved: user.isApproved || true,
      },
      token,
    },
  });
});

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by authenticate middleware
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export const getProfile = getMe;

/**
 * Logout
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Since JWT tokens are stateless, logout is primarily handled client-side
  // by removing the token from storage. This endpoint validates the token
  // and confirms logout.

  res.json({
    success: true,
    message: "Logout successful. Please remove the token from client storage.",
    data: {
      userId: req.userId,
      role: req.userRole,
    },
  });
});

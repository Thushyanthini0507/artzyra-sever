/**
 * Authentication Middleware
 * Provides JWT verification and approval checks
 * Uses centralized Users collection with single role per user
 */
import { verifyToken as verifyJwtToken } from "../config/jwt.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * JWT verification middleware
 * Verifies JWT token and loads user based on role
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new UnauthorizedError("Not authorized. No token provided.");
  }

  try {
    // Verify token
    const decoded = verifyJwtToken(token);

    // Find user in Users collection (central collection)
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      throw new UnauthorizedError("User not found. Token may be invalid.");
    }

    // Verify role matches
    if (user.role !== decoded.role) {
      throw new UnauthorizedError("Invalid token. Role mismatch.");
    }

    // Check if user is active
    if (user.isActive === false) {
      throw new ForbiddenError(
        "Your account has been deactivated. Please contact support."
      );
    }

    // Get profile from role-specific collection
    let profile = null;
    if (user.role === "customer") {
      profile = await Customer.findOne({ userId: user._id });
    } else if (user.role === "artist") {
      profile = await Artist.findOne({ userId: user._id })
        .populate("category", "name description");
    } else if (user.role === "admin") {
      profile = await Admin.findOne({ userId: user._id });
    }

    // Attach user and profile to request
    req.user = { ...user.toObject(), profile };
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token. Please log in again.");
    }
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token expired. Please log in again.");
    }
    throw error;
  }
});

// Backward compatibility export
export const authenticate = verifyToken;

/**
 * Optional authentication middleware
 * Allows public access if not logged in, else enforces login
 */
export const authOptional = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = verifyJwtToken(token);

      // Find user in Users collection
      const user = await User.findById(decoded.id).select("-password");
      
      if (user && user.role === decoded.role && user.isActive) {
        // Get profile from role-specific collection
        let profile = null;
        if (user.role === "customer") {
          profile = await Customer.findOne({ userId: user._id });
        } else if (user.role === "artist") {
          profile = await Artist.findOne({ userId: user._id })
            .populate("category", "name description");
        } else if (user.role === "admin") {
          profile = await Admin.findOne({ userId: user._id });
        }

        // Attach user and profile to request
        req.user = { ...user.toObject(), profile };
        req.userId = user._id;
        req.userRole = user.role;
      }
    } catch (error) {
      // If token is invalid, continue without user (public access)
    }
  }

  next();
});

/**
 * Check if user account is approved
 * Should be used after authenticate middleware
 * For artists, checks if status is "approved"
 */
export const checkApproval = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError("Not authorized. Please log in.");
  }

  // Admins and customers are always approved
  if (req.userRole === "admin" || req.userRole === "customer") {
    return next();
  }

  // For artists, check if status is "approved"
  if (req.userRole === "artist") {
    const artist = await Artist.findOne({ userId: req.userId });
    if (!artist || artist.status !== "approved") {
      throw new ForbiddenError(
        "Your account is pending approval. Please wait for admin approval."
      );
    }
  }

  next();
});

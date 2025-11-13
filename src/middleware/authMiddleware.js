/**
 * Authentication Middleware
 * Provides JWT verification and approval checks
 */
import { verifyToken as verifyJwtToken } from "../config/jwt.js";
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

    // Find user based on role
    let user = null;
    let userModel = null;

    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
      userModel = "Admin";
    } else if (decoded.role === "artist") {
      user = await Artist.findById(decoded.id).select("-password");
      userModel = "Artist";
    } else if (decoded.role === "customer") {
      user = await Customer.findById(decoded.id).select("-password");
      userModel = "Customer";
    } else {
      throw new UnauthorizedError("Invalid token. Unknown role.");
    }

    if (!user) {
      throw new UnauthorizedError("User not found. Token may be invalid.");
    }

    // Check if user is active (for artists and customers)
    if (userModel !== "Admin" && user.isActive === false) {
      throw new ForbiddenError(
        "Your account has been deactivated. Please contact support."
      );
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userModel = userModel;

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

// Backward compatibility export (to be deprecated)
export const authenticate = verifyToken;

/**
 * Check if user account is approved
 * Should be used after authenticate middleware
 */
export const checkApproval = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError("Not authorized. Please log in.");
  }

  // Admins are always approved
  if (req.userRole === "admin") {
    return next();
  }

  // Check if user is approved
  if (!req.user.isApproved) {
    throw new ForbiddenError(
      "Your account is pending approval. Please wait for admin approval."
    );
  }

  next();
});

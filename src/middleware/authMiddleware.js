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
  console.log("🔐 verifyToken called. Request path:", req.path);
  console.log("📋 Headers authorization:", req.headers.authorization ? "Present" : "Missing");
  console.log("🍪 Cookie token:", req.cookies?.token ? "Present" : "Missing");
  
  let token;

  // Priority 1: Extract token from cookie (preferred for security)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("✅ Token found in cookies");
  }
  // Priority 2: Extract token from Authorization header (fallback)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("✅ Token found in Authorization header");
  }

  if (!token) {
    console.error("❌ Authentication failed: No token provided");
    throw new UnauthorizedError("Not authorized. No token provided.");
  }

  try {
    // Verify token
    const decoded = verifyJwtToken(token);
    console.log("✅ Token decoded successfully. User ID:", decoded.id, "Role:", decoded.role);

    // Find user in Users collection (central collection)
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      console.error("❌ User not found for decoded token ID:", decoded.id);
      throw new UnauthorizedError("User not found. Token may be invalid.");
    }

    // Verify role matches
    if (user.role !== decoded.role) {
      console.error("❌ Role mismatch. Token role:", decoded.role, "User role:", user.role);
      throw new UnauthorizedError("Invalid token. Role mismatch.");
    }

    // Check if user is active
    if (user.isActive === false) {
      console.error("❌ User account is deactivated:", user._id);
      throw new ForbiddenError(
        "Your account has been deactivated. Please contact support."
      );
    }

    // Get profile from role-specific collection
    let profile = null;
    if (user.role === "customer") {
      profile = await Customer.findOne({ userId: user._id });
    } else if (user.role === "artist") {
      console.log("Fetching artist profile for user:", user._id);
      try {
        profile = await Artist.findOne({ userId: user._id })
          .populate("category", "name description");
        console.log("Artist profile fetched:", profile ? profile._id : "null");
      } catch (err) {
        console.error("Error fetching artist profile in verifyToken:", err);
        throw err;
      }
    } else if (user.role === "admin") {
      // Use findOneAndUpdate with upsert to atomically create Admin profile if it doesn't exist
      // This prevents race conditions when multiple requests try to create the profile simultaneously
      profile = await Admin.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, permissions: [] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Attach user and profile to request
    req.user = { ...user.toObject(), profile };
    req.userId = user._id;
    req.userRole = user.role;
    console.log("✅ Authentication successful for user:", user._id, "Role:", user.role);

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.error("❌ JWT Error: Invalid token format or signature");
      throw new UnauthorizedError("Invalid token. Please log in again.");
    }
    if (error.name === "TokenExpiredError") {
      console.error("❌ JWT Error: Token has expired");
      throw new UnauthorizedError("Token expired. Please log in again.");
    }
    console.error("❌ Authentication error:", error.message);
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

  // Priority 1: Extract token from cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Priority 2: Extract token from Authorization header
  else if (
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
          // Use findOneAndUpdate with upsert to atomically create Admin profile if it doesn't exist
          // This prevents race conditions when multiple requests try to create the profile simultaneously
          profile = await Admin.findOneAndUpdate(
            { userId: user._id },
            { userId: user._id, permissions: [] },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
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
  console.log("checkApproval called for role:", req.userRole);
  if (!req.user) {
    throw new UnauthorizedError("Not authorized. Please log in.");
  }

  // Admins and customers are always approved
  if (req.userRole === "admin" || req.userRole === "customer") {
    return next();
  }

  // For artists, check if status is "approved"
  if (req.userRole === "artist") {
    console.log("Checking approval for artist:", req.userId);
    try {
      const artist = await Artist.findOne({ userId: req.userId });
      if (!artist) {
        console.log("Artist profile not found in checkApproval");
        throw new ForbiddenError(
          "Your account is pending approval. Please wait for admin approval."
        );
      }
      // Check status (case-insensitive and handle different status values)
      const artistStatus = String(artist.status || "").toLowerCase().trim();
      console.log("Artist status:", artistStatus);
      if (artistStatus !== "approved") {
        throw new ForbiddenError(
          `Your account is pending approval. Current status: ${artist.status || "pending"}. Please wait for admin approval.`
        );
      }
    } catch (err) {
      console.error("Error in checkApproval:", err);
      throw err;
    }
  }

  next();
});

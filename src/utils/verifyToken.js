import { verifyToken as jwtVerifyToken } from "../config/jwt.js";
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token string
 * @returns {Object} Decoded token payload with id and role
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error("Token is required");
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    // Verify token
    const decoded = jwtVerifyToken(cleanToken);

    if (!decoded.id || !decoded.role) {
      throw new Error("Invalid token payload");
    }

    return decoded;
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw error;
  }
};

/**
 * Verify token and get user from database
 * @param {string} token - JWT token string
 * @returns {Object} User object with id, role, and user data
 * @throws {Error} If token is invalid or user not found
 */
export const verifyTokenAndGetUser = async (token) => {
  try {
    const decoded = verifyToken(token);

    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    } else if (decoded.role === "artist") {
      user = await Artist.findById(decoded.id).select("-password");
    } else if (decoded.role === "customer") {
      user = await Customer.findById(decoded.id).select("-password");
    } else {
      throw new Error("Invalid user role");
    }

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: decoded.id,
      role: decoded.role,
      user,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Extract token from request headers
 * @param {Object} headers - Request headers object
 * @returns {string|null} Token string or null if not found
 */
export const extractTokenFromHeaders = (headers) => {
  if (headers.authorization && headers.authorization.startsWith("Bearer")) {
    return headers.authorization.split(" ")[1];
  }
  return null;
};

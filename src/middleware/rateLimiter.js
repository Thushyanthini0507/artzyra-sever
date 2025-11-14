/**
 * Rate Limiter Middleware
 * Provides rate limiting for sensitive routes
 */
import rateLimit from "express-rate-limit";

/**
 * Helper to build JSON response message
 */
const buildMessage = (message) => ({
  success: false,
  message,
});

/**
 * Registration rate limiter
 * Limit to 5 registration attempts per hour per IP
//  */
// export const registerRateLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5,
//   message: buildMessage(
//     "Too many registration attempts. Please try again after an hour."
//   ),
//   standardHeaders: true,
//   legacyHeaders: false,
// });

/**
 * Authentication rate limiter
 * Limit to 10 login attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: buildMessage(
    "Too many login attempts. Please try again after 15 minutes."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment rate limiter
 * Limit to 20 payment attempts per 15 minutes per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: buildMessage(
    "Too many payment requests. Please wait a few minutes and try again."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Limits overall API usage to prevent abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: buildMessage(
    "Too many requests from this IP. Please try again later."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  // registerRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  apiRateLimiter,
};

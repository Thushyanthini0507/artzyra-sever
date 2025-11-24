import { ForbiddenError } from "../utils/errors.js";
import { asyncHandler } from "./authMiddleware.js";

/**
 * Role-based Authorization Middleware
 * Restricts access based on user roles. Accepts a single role or array of roles.
 * @param {string|string[]} roles - Allowed roles
 */
export const requireRole = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const normalizedRoles = allowedRoles
    .filter((role) => typeof role === "string")
    .map((role) => role.toLowerCase());

  return asyncHandler((req, res, next) => {
    const userRole = req.userRole ? req.userRole.toLowerCase() : null;

    if (!req.user || !userRole) {
      throw new ForbiddenError("Not authorized. Please log in.");
    }

    if (
      normalizedRoles.length > 0 &&
      !normalizedRoles.includes(userRole)
    ) {
      throw new ForbiddenError(
        `Access denied. This action requires one of the following roles: ${normalizedRoles.join(", ")}`
      );
    }

    next();
  });
};

// Backward compatibility export
export const verifyRole = requireRole;

// Convenience exports for frequently used roles
export const adminOnly = requireRole("admin");
export const artistOnly = requireRole("artist");
export const customerOnly = requireRole("customer");
export const artistOrCustomer = requireRole(["artist", "customer"]);

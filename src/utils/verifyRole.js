/**
 * Verify if user has required role(s)
 * @param {string|Array<string>} userRole - User's current role
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {boolean} True if user has required role
 */
export const verifyRole = (userRole, requiredRoles) => {
  if (!userRole) {
    return false;
  }

  // Convert to array if single role
  const rolesArray = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];
  const userRoleArray = Array.isArray(userRole) ? userRole : [userRole];

  // Check if user has any of the required roles
  return rolesArray.some((role) => userRoleArray.includes(role));
};

/**
 * Verify if user has admin role
 * @param {string} userRole - User's current role
 * @returns {boolean} True if user is admin
 */
export const isAdmin = (userRole) => {
  return userRole === "admin";
};

/**
 * Verify if user has artist role
 * @param {string} userRole - User's current role
 * @returns {boolean} True if user is artist
 */
export const isArtist = (userRole) => {
  return userRole === "artist";
};

/**
 * Verify if user has customer role
 * @param {string} userRole - User's current role
 * @returns {boolean} True if user is customer
 */
export const isCustomer = (userRole) => {
  return userRole === "customer";
};

/**
 * Verify if user has artist or customer role
 * @param {string} userRole - User's current role
 * @returns {boolean} True if user is artist or customer
 */
export const isArtistOrCustomer = (userRole) => {
  return userRole === "artist" || userRole === "customer";
};

/**
 * Verify if user can access resource (owner or admin)
 * @param {string} userRole - User's current role
 * @param {string} resourceOwnerId - Resource owner's ID
 * @param {string} userId - Current user's ID
 * @returns {boolean} True if user is owner or admin
 */
export const canAccessResource = (userRole, resourceOwnerId, userId) => {
  if (userRole === "admin") {
    return true;
  }
  return resourceOwnerId?.toString() === userId?.toString();
};

/**
 * Verify if user can modify resource (owner or admin)
 * @param {string} userRole - User's current role
 * @param {string} resourceOwnerId - Resource owner's ID
 * @param {string} userId - Current user's ID
 * @returns {boolean} True if user can modify
 */
export const canModifyResource = (userRole, resourceOwnerId, userId) => {
  return canAccessResource(userRole, resourceOwnerId, userId);
};

/**
 * Verify if user can delete resource (owner or admin)
 * @param {string} userRole - User's current role
 * @param {string} resourceOwnerId - Resource owner's ID
 * @param {string} userId - Current user's ID
 * @returns {boolean} True if user can delete
 */
export const canDeleteResource = (userRole, resourceOwnerId, userId) => {
  return canAccessResource(userRole, resourceOwnerId, userId);
};

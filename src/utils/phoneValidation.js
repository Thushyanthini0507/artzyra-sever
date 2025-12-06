/**
 * Sri Lankan Phone Number Validation and Formatting
 * 
 * Valid formats:
 * - 0XX-XXXXXXX (10 digits with leading 0)
 * - 7XXXXXXXX (9 digits without leading 0)
 * 
 * Mobile prefixes: 070, 071, 072, 074, 075, 076, 077, 078
 * Landline prefixes: 011, 033, etc.
 */

/**
 * Validate Sri Lankan phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidSriLankanPhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // Must be 9 or 10 digits
  if (digitsOnly.length !== 9 && digitsOnly.length !== 10) {
    return false;
  }

  // If 10 digits, must start with 0
  if (digitsOnly.length === 10 && digitsOnly[0] !== "0") {
    return false;
  }

  // If 9 digits, must start with 7
  if (digitsOnly.length === 9 && digitsOnly[0] !== "7") {
    return false;
  }

  // Check mobile prefixes (070-078)
  const mobilePrefix = digitsOnly.length === 10 
    ? digitsOnly.substring(0, 3) 
    : `0${digitsOnly.substring(0, 2)}`;
  
  const validMobilePrefixes = ["070", "071", "072", "074", "075", "076", "077", "078"];
  
  if (validMobilePrefixes.includes(mobilePrefix)) {
    return true;
  }

  // Check landline prefixes (011, 033, etc.)
  const landlinePrefix = digitsOnly.length === 10 
    ? digitsOnly.substring(0, 3) 
    : `0${digitsOnly.substring(0, 2)}`;
  
  // Common landline prefixes (can be extended)
  const validLandlinePrefixes = ["011", "033", "034", "035", "036", "037", "038", "041", "045", "047", "051", "052", "053", "054", "055", "057", "063", "065", "066", "067", "081", "091"];
  
  return validLandlinePrefixes.includes(landlinePrefix);
};

/**
 * Format phone number to Sri Lankan standard format (0XX-XXXXXXX)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number or original if invalid
 */
export const formatSriLankanPhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // If empty, return empty string
  if (digitsOnly.length === 0) {
    return "";
  }

  // If 9 digits (without leading 0), add 0
  if (digitsOnly.length === 9) {
    return `0${digitsOnly}`;
  }

  // If 10 digits, return as is
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }

  // If invalid length, return original (will be caught by validation)
  return phone;
};

/**
 * Normalize phone number (remove formatting, ensure leading 0)
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
export const normalizeSriLankanPhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // If empty, return empty string
  if (digitsOnly.length === 0) {
    return "";
  }

  // If 9 digits (without leading 0), add 0
  if (digitsOnly.length === 9) {
    return `0${digitsOnly}`;
  }

  // If 10 digits, return as is
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }

  // Return original if invalid (will be caught by validation)
  return phone;
};


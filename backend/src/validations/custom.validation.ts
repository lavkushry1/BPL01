/**
 * Custom validation functions for Zod schemas
 */

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param value - The string to validate
 * @returns Boolean indicating if valid or error message
 */
export const objectId = (value: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * Validates if a value is a valid password
 * @param value - The password to validate
 * @returns Boolean indicating if valid or error message
 */
export const password = (value: string): boolean => {
  return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(value);
};

/**
 * Validates if a string is a valid URL
 * @param value - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export const url = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates if a string is a valid email
 * @param value - The email to validate
 * @returns true if the email is valid, false otherwise
 */
export const email = (value: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(value);
};

/**
 * Validates if a string is a valid phone number
 * @param value - The phone number to validate
 * @returns true if the phone number is valid, false otherwise
 */
export const phone = (value: string): boolean => {
  // Basic international phone validation
  const phonePattern = /^\+?[1-9]\d{1,14}$/;
  return phonePattern.test(value);
}; 
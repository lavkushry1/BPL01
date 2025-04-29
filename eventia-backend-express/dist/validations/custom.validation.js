"use strict";
/**
 * Custom validation functions for Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phone = exports.email = exports.url = exports.password = exports.objectId = void 0;
/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param value - The string to validate
 * @returns Boolean indicating if valid or error message
 */
const objectId = (value) => {
    return /^[0-9a-fA-F]{24}$/.test(value);
};
exports.objectId = objectId;
/**
 * Validates if a value is a valid password
 * @param value - The password to validate
 * @returns Boolean indicating if valid or error message
 */
const password = (value) => {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(value);
};
exports.password = password;
/**
 * Validates if a string is a valid URL
 * @param value - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
const url = (value) => {
    try {
        new URL(value);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.url = url;
/**
 * Validates if a string is a valid email
 * @param value - The email to validate
 * @returns true if the email is valid, false otherwise
 */
const email = (value) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(value);
};
exports.email = email;
/**
 * Validates if a string is a valid phone number
 * @param value - The phone number to validate
 * @returns true if the phone number is valid, false otherwise
 */
const phone = (value) => {
    // Basic international phone validation
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    return phonePattern.test(value);
};
exports.phone = phone;

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes with tailwind-merge to handle
 * Tailwind CSS class conflicts properly
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a price in cents/paisa to a currency string
 * 
 * @param price Price in cents/paisa
 * @param currencyCode Currency code (default: INR)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number, currencyCode: string = "INR"): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  });

  // Convert from cents/paisa to whole units
  return formatter.format(price);
}

/**
 * Format a date into a readable string
 * 
 * @param date Date to format (ISO string or Date object)
 * @param format Format style (default: "medium")
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  format: "full" | "short" | "medium" = "medium"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = 
    format === "full" 
      ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      : format === "medium"
      ? { year: "numeric", month: "short", day: "numeric" }
      : { month: "short", day: "numeric" };
      
  return new Intl.DateTimeFormat("en-IN", options).format(dateObj);
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length (default: 100)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Get initials from a name (up to 2 characters)
 * 
 * @param name Full name to extract initials from
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ").filter(Boolean);
  
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

/**
 * Check if a string is a valid email address
 * 
 * @param email Email address to validate
 * @returns Boolean indicating if the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Convert a phone number to a standardized format
 * 
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format based on length (assuming Indian phone numbers)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  // Return as is if we can't format it
  return phone;
}

/**
 * Format currency amount to local string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Format UTR/Reference number with spaces for better readability
 */
export function formatReferenceNumber(ref: string): string {
  if (!ref) return '';
  return ref.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

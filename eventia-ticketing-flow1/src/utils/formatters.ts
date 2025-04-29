/**
 * Utility functions for formatting values like currency, dates, etc.
 */

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: INR)
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date
 * @param date - Date to format
 * @param format - Format to use (short, medium, long)
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'en-IN'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric',
  };
  
  if (format === 'long') {
    options.weekday = 'long';
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format a number with commas
 * @param num - Number to format
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted number string
 */
export const formatNumber = (num: number, locale: string = 'en-IN'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format a duration in minutes to hours and minutes
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}; 
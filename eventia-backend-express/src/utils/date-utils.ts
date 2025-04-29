/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format a date and time string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if a date is in the past
 * @param dateString ISO date string
 * @returns Boolean indicating if date is in the past
 */
export const isDatePast = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * Calculate days remaining from now to a future date
 * @param dateString ISO date string
 * @returns Number of days remaining, or 0 if date is in the past
 */
export const daysRemaining = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date < now) return 0;
  
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

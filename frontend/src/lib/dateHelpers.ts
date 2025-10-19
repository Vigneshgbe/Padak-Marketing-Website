// src/utils/dateHelpers.ts

export const safeDate = (date: any): Date | null => {
  if (!date) return null;

  try {
    // If it's already a Date object
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }

    // If it's a Firestore Timestamp (has toDate method)
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }

    // If it's an object with seconds (Firestore Timestamp serialized)
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }

    // If it's an ISO string or timestamp
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format date to locale string with fallback
 */
export const formatDate = (date: any, options?: Intl.DateTimeFormatOptions): string => {
  const parsedDate = safeDate(date);
  if (!parsedDate) return 'Invalid Date';

  try {
    return parsedDate.toLocaleDateString('en-US', options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format date and time to locale string with fallback
 */
export const formatDateTime = (date: any): string => {
  const parsedDate = safeDate(date);
  if (!parsedDate) return 'Invalid Date';

  try {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};
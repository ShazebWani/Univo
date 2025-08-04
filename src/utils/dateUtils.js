import { differenceInDays } from 'date-fns';

/**
 * Converts Firebase Timestamp to JavaScript Date
 * @param {any} timestamp - Firebase Timestamp or Date object
 * @returns {Date} JavaScript Date object
 */
export const convertFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  
  // If it's already a Date object, return as is
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firebase Timestamp, convert it
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // If it's a number (unix timestamp), convert it
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  return null;
};

/**
 * Formats a date for display
 * @param {any} timestamp - Firebase Timestamp or Date object
 * @param {string} format - Format type ('relative', 'short', 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, format = 'relative') => {
  const date = convertFirebaseTimestamp(timestamp);
  if (!date) return 'Unknown date';
  
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  
  switch (format) {
    case 'relative':
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
      return `${Math.floor(diffInDays / 365)} years ago`;
      
    case 'short':
      return date.toLocaleDateString();
      
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Checks if a product was recently listed (within 7 days)
 * @param {any} timestamp - Firebase Timestamp or Date object
 * @returns {boolean} True if recently listed
 */
export const isRecentlyListed = (timestamp) => {
  const date = convertFirebaseTimestamp(timestamp);
  if (!date) return false;
  
  const daysDiff = differenceInDays(new Date(), date);
  return daysDiff <= 7;
};

/**
 * Sorts items by date (newest first)
 * @param {Array} items - Array of items with date fields
 * @param {string} dateField - Name of the date field
 * @returns {Array} Sorted array
 */
export const sortByDate = (items, dateField = 'created_date') => {
  return items.sort((a, b) => {
    const dateA = convertFirebaseTimestamp(a[dateField]);
    const dateB = convertFirebaseTimestamp(b[dateField]);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateB - dateA; // Newest first
  });
};
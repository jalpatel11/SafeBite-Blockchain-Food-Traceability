/**
 * Helper Utilities
 * Common utility functions
 */

import { ROLE_NAMES, STATUS_NAMES } from './constants';

/**
 * Format Ethereum address
 * Shows first 6 and last 4 characters
 * 
 * @param {string} address - Ethereum address
 * @returns {string} Formatted address
 * 
 * Checks if address is valid and returns formatted string like "0x1234...5678".
 * Returns original address if invalid.
 */
export function formatAddress(address) {
  if (!address || typeof address !== 'string') {
    return address || '';
  }
  
  if (!isValidAddress(address)) {
  return address;
  }
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format timestamp to readable date
 * 
 * @param {number|string} timestamp - Unix timestamp (in seconds or milliseconds)
 * @returns {string} Formatted date string
 * 
 * Handles timestamps in both seconds and milliseconds format.
 * Returns a human-readable date string like "Jan 15, 2024, 2:30:45 PM"
 * Returns 'N/A' if timestamp is invalid or missing.
 * 
 * Logic:
 * - Timestamps from blockchain are typically in seconds (e.g., 1763685639)
 * - JavaScript Date expects milliseconds
 * - If timestamp < year 2000 in milliseconds (946684800000), assume it's in seconds
 */
export function formatDate(timestamp) {
  // Handle null, undefined, or empty values
  if (!timestamp && timestamp !== 0) {
    return 'N/A';
  }

  // Convert to number if it's a string
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : Number(timestamp);
  
  // Check if timestamp is valid
  if (isNaN(ts) || ts <= 0) {
    return 'N/A';
  }

  // Determine if timestamp is in seconds or milliseconds
  // Year 2000 in milliseconds = 946684800000
  // If timestamp is less than this, it's likely in seconds
  let date;
  if (ts < 946684800000) {
    // Timestamp is in seconds (e.g., 1763685639) - convert to milliseconds
    date = new Date(ts * 1000);
  } else {
    // Timestamp is already in milliseconds
    date = new Date(ts);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'N/A';
  }

  // Format date to readable string
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Get role name from role number
 * 
 * @param {number} role - Role enum value
 * @returns {string} Role name
 */
export function getRoleName(role) {
  return ROLE_NAMES[role] || 'Unknown';
}

/**
 * Get status name from status number
 * 
 * @param {number} status - Status enum value
 * @returns {string} Status name
 */
export function getStatusName(status) {
  return STATUS_NAMES[status] || 'Unknown';
}

/**
 * Validate Ethereum address
 * 
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate product ID
 * 
 * @param {number} productId - Product ID
 * @returns {boolean} True if valid
 */
export function isValidProductId(productId) {
  return Number.isInteger(productId) && productId > 0;
}


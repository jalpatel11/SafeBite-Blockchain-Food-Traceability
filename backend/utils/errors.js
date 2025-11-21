/**
 * Error Handling Utilities
 * Standardized error responses for API
 */

/**
 * Create standardized error response
 * 
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Formatted error response
 * 
 * TODO:
 * 1. Parse error message from blockchain transactions
 * 2. Extract user-friendly error messages
 * 3. Return formatted error object with status code
 */
function formatError(error, context = 'Unknown') {
  // Parse different error types
  // - Contract revert errors
  // - Network errors
  // - Validation errors
  // - Return { message, code, context }
  
  const friendlyMessage = parseContractError(error);
  
  // Determine error code based on error type
  let errorCode = 'UNKNOWN_ERROR';
  if (error.code) {
    errorCode = error.code;
  } else if (error.message && error.message.includes('revert')) {
    errorCode = 'CONTRACT_ERROR';
  } else if (error.message && (error.message.includes('network') || error.message.includes('connection'))) {
    errorCode = 'NETWORK_ERROR';
  } else if (error.message && error.message.includes('validation')) {
    errorCode = 'VALIDATION_ERROR';
  }
  
  return {
    error: true,
    message: friendlyMessage,
    context: context,
    code: errorCode
  };
}

/**
 * Handle contract transaction errors
 * 
 * @param {Error} error - Transaction error
 * @returns {string} User-friendly error message
 * 
 * Parses common contract errors and returns user-friendly messages.
 * Handles contract revert errors, network errors, and validation errors.
 */
function parseContractError(error) {
  const errorMessage = error.message || error.toString();
  
  // Common contract error patterns
  const errorMappings = {
    'caller is not a producer': 'You must be a PRODUCER to perform this action',
    'caller is not a regulator': 'You must be a REGULATOR to perform this action',
    'caller is not the product owner': 'You are not the owner of this product',
    'product does not exist': 'Product not found',
    'insufficient funds': 'Insufficient balance for transaction',
    'cannot transfer to zero address': 'Invalid recipient address',
    'cannot transfer to yourself': 'Cannot transfer product to yourself',
    'recipient must be': 'Invalid recipient role',
    'status is already set': 'Product status is already set to this value',
    'cannot change status after DELIVERED': 'Cannot modify product after it has been delivered',
    'quality score must be 0-100': 'Quality score must be between 0 and 100',
    'metadata hash cannot be empty': 'Metadata hash is required',
    'product name cannot be empty': 'Product name is required',
    'batch ID cannot be empty': 'Batch ID is required',
    'origin cannot be empty': 'Origin is required',
    'account does not have this role': 'Account does not have the specified role',
    'cannot grant role to zero address': 'Invalid address for role assignment',
    'CONSUMER role is public': 'CONSUMER role does not need to be granted'
  };
  
  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  // Extract error from revert reason if present
  const revertMatch = errorMessage.match(/revert\s+(.+)/i) || 
                      errorMessage.match(/reason:\s*(.+)/i) ||
                      errorMessage.match(/execution reverted:\s*(.+)/i);
  
  if (revertMatch && revertMatch[1]) {
    return revertMatch[1].trim();
  }
  
  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network error: Unable to connect to blockchain';
  }
  
  // Return original message if no pattern matches
  return errorMessage;
}

module.exports = {
  formatError,
  parseContractError
};


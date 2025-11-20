/**
 * Error Handling Utilities
 * Standardized error responses for API
 */

/**
 * Format an error consistently.
 * Adds HTTP code and context.
 */
function formatError(error, context = 'Unknown') {
  // If it already has a numeric HTTP status, keep it
  const code = error.status || 500;

  // Normalize message
  const message =
    (error && error.message) ||
    (typeof error === 'string' ? error : 'An unknown error occurred');

  // You can add friendly mapping here for blockchain revert messages etc.
  const friendly = parseContractError(error);

  return {
    error: true,
    code,
    context,
    message: friendly || message
  };
}

/**
 * Convert low-level blockchain or app errors to user-friendly text
 */
function parseContractError(error) {
  if (!error || !error.message) return null;
  const msg = error.message.toLowerCase();

  if (msg.includes('caller is not a producer'))
    return "You don't have permission for this action.";
  if (msg.includes('product does not exist'))
    return 'Product not found.';
  if (msg.includes('insufficient funds'))
    return 'Insufficient balance.';
  if (msg.includes('revert'))
    return 'Smart contract reverted the transaction.';
  if (msg.includes('network'))
    return 'Blockchain network error. Please try again later.';
  return null; // default
}

/**
 * Helper to make an HTTP-style error object
 */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = {
  formatError,
  parseContractError,
  httpError
};
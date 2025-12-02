/**
 * Helper Utilities
 * Common utility functions for backend
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Load contract addresses from deployment file
 * 
 * @returns {Object} Contract addresses with accessControl and supplyChain properties
 * @throws {Error} If deployment file doesn't exist or is invalid
 * 
 * Reads from deployments/local.json and extracts contract addresses.
 * Returns object with accessControl (SafeBiteAccessRoles) and supplyChain (SafeBiteSupplyChain) addresses.
 */
function loadContractAddresses() {
  const deploymentPath = path.join(__dirname, '../../deployments/local.json');
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found at ${deploymentPath}`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contracts = deploymentData.contracts;
  
  if (!contracts || !contracts.SafeBiteAccessRoles || !contracts.SafeBiteSupplyChain) {
    throw new Error('Invalid deployment file: missing contract addresses');
  }
  
  return {
    accessControl: contracts.SafeBiteAccessRoles,
    supplyChain: contracts.SafeBiteSupplyChain
  };
}

/**
 * Load contract ABI from artifacts
 * 
 * @param {string} contractName - Name of contract (e.g., "SafeBiteSupplyChain")
 * @returns {Array} Contract ABI array
 * @throws {Error} If ABI file doesn't exist or is invalid
 * 
 * Reads ABI from artifacts/contracts/{contractName}.sol/{contractName}.json.
 * Returns the ABI array from the artifact file.
 */
function loadContractABI(contractName) {
  const abiPath = path.join(__dirname, '../../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(abiPath)) {
    throw new Error(`ABI file not found at ${abiPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  
  if (!artifact.abi) {
    throw new Error(`Invalid artifact file: missing ABI for ${contractName}`);
  }
  
  return artifact.abi;
}

/**
 * Validate Ethereum address
 * 
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid address
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate product ID
 * 
 * @param {number} productId - Product ID
 * @returns {boolean} True if valid product ID
 */
function isValidProductId(productId) {
  return Number.isInteger(productId) && productId > 0;
}

/**
 * Get deployer address from deployment file
 * 
 * @returns {string} Deployer address (contract owner)
 * @throws {Error} If deployment file doesn't exist or is invalid
 * 
 * Reads from deployments/local.json and returns the deployer address.
 * This is the contract owner who can grant roles.
 */
function getDeployerAddress() {
  const deploymentPath = path.join(__dirname, '../../deployments/local.json');
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found at ${deploymentPath}`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  if (!deploymentData.deployer) {
    throw new Error('Invalid deployment file: missing deployer address');
  }
  
  return deploymentData.deployer;
}

/**
 * Generate a certificate hash for quality or compliance checks
 * 
 * @param {Object} data - Certificate data object
 * @param {number} data.productId - Product ID
 * @param {string} data.type - Certificate type ('QUALITY_CHECK' or 'COMPLIANCE')
 * @param {string} data.verifier - Verifier address
 * @param {number|boolean} data.result - Quality score (0-100) or compliance status (true/false)
 * @param {string} data.notes - Additional notes
 * @param {number} data.timestamp - Timestamp of verification
 * @returns {string} SHA256 hash of the certificate data (hex string with 0x prefix)
 * 
 * Generates a deterministic hash from certificate data to serve as a unique certificate identifier.
 * The hash is computed from a JSON string of the data, ensuring consistency and verifiability.
 */
function generateCertificateHash(data) {
  const { productId, type, verifier, result, notes = '', timestamp } = data;
  
  // Create a structured certificate object
  const certificate = {
    productId,
    type,
    verifier: verifier.toLowerCase(), // Normalize address
    result,
    notes,
    timestamp
  };
  
  // Convert to JSON string and hash it
  const certificateString = JSON.stringify(certificate);
  const hash = crypto.createHash('sha256').update(certificateString).digest('hex');
  
  return `0x${hash}`;
}

/**
 * Parse and merge certificate metadata hash
 * 
 * @param {string} existingHash - Existing metadata hash (may be JSON or empty)
 * @param {string} type - Certificate type ('quality' or 'compliance')
 * @param {string} newHash - New certificate hash to add/update
 * @returns {string} Merged metadata hash as JSON string
 * 
 * Parses existing metadata hash (if it's JSON), merges with new certificate,
 * or creates new JSON structure if existing hash is empty or invalid JSON.
 */
function mergeCertificateMetadata(existingHash, type, newHash) {
  let metadata = {};
  
  // Try to parse existing hash as JSON
  if (existingHash && existingHash.trim().length > 0) {
    try {
      // Check if it's already JSON
      if (existingHash.trim().startsWith('{')) {
        metadata = JSON.parse(existingHash);
      } else {
        // If it's a plain hash, preserve it as 'legacy' or 'initial'
        metadata.legacy = existingHash;
      }
    } catch (e) {
      // If parsing fails, treat as legacy hash
      metadata.legacy = existingHash;
    }
  }
  
  // Add/update the certificate hash
  metadata[type] = newHash;
  
  return JSON.stringify(metadata);
}

/**
 * Format Unix timestamp to human-readable date string
 * 
 * @param {number|string} timestamp - Unix timestamp (in seconds or milliseconds)
 * @returns {string} Formatted date string like "Jan 15, 2024, 2:30:45 PM"
 * 
 * Intelligently detects if timestamp is in seconds (if less than year 2000 in milliseconds)
 * and converts it to milliseconds before formatting.
 * Returns 'N/A' if timestamp is invalid.
 */
function formatDate(timestamp) {
  if (!timestamp && timestamp !== 0) {
    return 'N/A';
  }
  
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : Number(timestamp);
  
  if (isNaN(ts) || ts <= 0) {
    return 'N/A';
  }
  
  let date;
  // If timestamp is less than year 2000 in milliseconds, assume it's in seconds
  if (ts < 946684800000) { // Year 2000 in milliseconds
    date = new Date(ts * 1000);
  } else {
    date = new Date(ts);
  }
  
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
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

module.exports = {
  loadContractAddresses,
  loadContractABI,
  isValidAddress,
  isValidProductId,
  getDeployerAddress,
  generateCertificateHash,
  mergeCertificateMetadata,
  formatDate
};


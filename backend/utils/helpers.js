/**
 * Helper Utilities
 * Common utility functions for backend
 */

const fs = require('fs');
const path = require('path');

/** Resolve project root assuming this file is at backend/utils/helpers.js */
const BACKEND_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(BACKEND_DIR, '..');

/** Safely read JSON file if it exists */
function readJsonIfExists(p) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (_) {/* ignore */}
  return null;
}

/**
 * Load contract addresses with sensible fallbacks.
 * Priority:
 *  1) ENV vars
 *  2) deployments/local.json or deployments/localhost.json
 * Returns { accessControl, supplyChain }
 */
function loadContractAddresses() {
  // ENV first (works for any network)
  const fromEnv = {
    accessControl: process.env.ACCESS_ROLES_ADDRESS || process.env.ACCESSCONTROL_ADDRESS,
    supplyChain: process.env.SUPPLY_CHAIN_ADDRESS || process.env.SUPPLYCHAIN_ADDRESS
  };
  if (fromEnv.accessControl && fromEnv.supplyChain) return fromEnv;

  // Try typical deployment files (Hardhat/Foundry style)
  const candidates = [
    path.join(ROOT_DIR, 'deployments', 'local.json'),
    path.join(ROOT_DIR, 'deployments', 'localhost.json'),
    path.join(ROOT_DIR, 'deployments', 'dev.json'),
  ];

  for (const p of candidates) {
    const j = readJsonIfExists(p);
    if (j) {
      // allow various keys / shapes
      const accessControl =
        j.ACCESS_ROLES_ADDRESS || j.AccessRoles || j.accessControl || j.access_roles || j.AccessControl;
      const supplyChain =
        j.SUPPLY_CHAIN_ADDRESS || j.SafeBiteSupplyChain || j.supplyChain || j.supply_chain;

      if (accessControl && supplyChain) {
        return { accessControl, supplyChain };
      }
    }
  }

  // Nothing found
  throw new Error(
    'Contract addresses not configured. Set ACCESS_ROLES_ADDRESS and SUPPLY_CHAIN_ADDRESS in .env, ' +
    'or add deployments/local.json with the addresses.'
  );
}

/**
 * Load contract ABI from artifacts; fallback to backend/services/abi
 * @param {string} contractName e.g. "SafeBiteSupplyChain" or "SafeBiteAccessRoles"
 * @returns {Object} ABI array
 */
function loadContractABI(contractName) {
  // Try Hardhat artifacts path
  const hardhatArtifact = path.join(
    ROOT_DIR,
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );

  const foundryArtifact = path.join(
    ROOT_DIR,
    'out',
    `${contractName}.sol`,
    `${contractName}.json`
  );

  const fallbackAbi = path.join(
    BACKEND_DIR,
    'services',
    'abi',
    `${contractName}.json`
  );

  // 1) Hardhat
  const hardhatJson = readJsonIfExists(hardhatArtifact);
  if (hardhatJson && Array.isArray(hardhatJson.abi)) return hardhatJson.abi;

  // 2) Foundry (abi may be under abi key)
  const foundryJson = readJsonIfExists(foundryArtifact);
  if (foundryJson) {
    if (Array.isArray(foundryJson.abi)) return foundryJson.abi;
    if (foundryJson.abi && Array.isArray(foundryJson.abi)) return foundryJson.abi;
  }

  // 3) Fallback: backend/services/abi
  const abiJson = readJsonIfExists(fallbackAbi);
  if (abiJson && (Array.isArray(abiJson.abi) || Array.isArray(abiJson))) {
    // Some ABIs are stored as the ABI array only; others inside { abi: [...] }
    return Array.isArray(abiJson) ? abiJson : abiJson.abi;
  }

  throw new Error(
    `ABI for ${contractName} not found. Ensure Hardhat artifacts exist or place ${contractName}.json in backend/services/abi/.`
  );
}

/**
 * Validate Ethereum address (simple check)
 * @param {string} address
 * @returns {boolean}
 */
function isValidAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate product ID (allow 0!)
 * @param {number|string} productId
 * @returns {boolean}
 */
function isValidProductId(productId) {
  const n = Number(productId);
  return Number.isInteger(n) && n >= 0;
}

/**
 * Require fields helper: throws 400 on missing
 * @param {Object} obj
 * @param {string[]} fields
 */
function requireFields(obj, fields) {
  const missing = fields.filter(f => obj[f] == null || obj[f] === '');
  if (missing.length) {
    const err = new Error(`Missing fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

module.exports = {
  loadContractAddresses,
  loadContractABI,
  isValidAddress,
  isValidProductId,
  requireFields
};
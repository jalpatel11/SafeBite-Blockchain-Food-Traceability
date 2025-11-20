/**
 * Role Controller
 * Handles role-related operations
 */

const contractService = require('../services/contractService');
const { formatError } = require('../utils/errors');
const { isValidAddress } = require('../utils/helpers');

// Keep in sync with your contracts' enum
const ROLE_NAMES = ['PRODUCER', 'DISTRIBUTOR', 'RETAILER', 'REGULATOR', 'CONSUMER'];

/**
 * Check user role
 * GET /api/roles/check/:address
 */
async function checkRole(req, res) {
  try {
    const { address } = req.params;

    // Validate
    if (!isValidAddress(address)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'checkRole',
        message: 'Invalid Ethereum address'
      });
    }

    // Read role (may be number, string, or null in mock)
    const roleValue = await contractService.getUserRole(address);

    // If no role assigned, return NONE cleanly
    if (roleValue === null || roleValue === undefined || roleValue === '') {
      return res.json({
        success: true,
        address,
        role: null,
        roleName: 'NONE'
      });
    }

    const roleNum = Number(roleValue);
    const roleName = ROLE_NAMES[roleNum] || String(roleValue) || 'UNKNOWN';

    return res.json({
      success: true,
      address,
      role: roleNum,
      roleName
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'checkRole'));
  }
}

/**
 * Get current user's role
 * GET /api/roles/my-role?address=0x...
 */
async function getMyRole(req, res) {
  try {
    const { address } = req.query;

    if (!isValidAddress(address)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'getMyRole',
        message: 'Invalid Ethereum address'
      });
    }

    const roleValue = await contractService.getUserRole(address);

    if (roleValue === null || roleValue === undefined || roleValue === '') {
      return res.json({
        success: true,
        role: null,
        roleName: 'NONE'
      });
    }

    const roleNum = Number(roleValue);
    const roleName = ROLE_NAMES[roleNum] || String(roleValue) || 'UNKNOWN';

    return res.json({
      success: true,
      role: roleNum,
      roleName
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getMyRole'));
  }
}

/**
 * Grant role to address (Admin-only on-chain; open in mock)
 * POST /api/roles/grant
 * Body: { signerAddress, accountAddress, role }
 */
async function grantRole(req, res) {
  try {
    const { signerAddress, accountAddress, role } = req.body || {};

    // Validate presence
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (!accountAddress) missing.push('accountAddress');
    if (role === undefined || role === null) missing.push('role');
    if (missing.length) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'grantRole',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }

    // Validate formats
    if (!isValidAddress(signerAddress) || !isValidAddress(accountAddress)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'grantRole',
        message: 'Invalid Ethereum address format'
      });
    }

    const roleNum = Number(role);
    if (!Number.isInteger(roleNum) || roleNum < 0 || roleNum >= ROLE_NAMES.length) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'grantRole',
        message: `Invalid role. Use 0..${ROLE_NAMES.length - 1}`
      });
    }

    // Execute (mock: ok; on-chain: must be admin/owner)
    const tx = await contractService.grantRole(signerAddress, accountAddress, roleNum);

    return res.json({
      success: true,
      transactionHash: tx?.txHash || null,
      message: `Role ${ROLE_NAMES[roleNum]} granted to ${accountAddress}`
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'grantRole'));
  }
}

module.exports = {
  checkRole,
  getMyRole,
  grantRole
};
/**
 * Verification Controller
 * Handles product verification operations (authenticity, quality, compliance)
 */

const contractService = require('../services/contractService');
const { formatError } = require('../utils/errors');
const { isValidProductId, isValidAddress } = require('../utils/helpers');

// Role enum (keep in sync with your contracts)
const ROLES = {
  PRODUCER: 0,
  DISTRIBUTOR: 1,
  RETAILER: 2,
  REGULATOR: 3,
  CONSUMER: 4
};

/**
 * Verify product authenticity
 * POST /api/verification/authenticity
 * Body: { signerAddress, productId, notes }
 */
async function verifyAuthenticity(req, res) {
  try {
    const { signerAddress, productId, notes = '' } = req.body || {};

    // Validate inputs
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (productId === undefined || productId === null) missing.push('productId');
    if (missing.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'verifyAuthenticity',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }
    if (!isValidAddress(signerAddress)) {
      return res.status(400).json({
        error: true, code: 400, context: 'verifyAuthenticity',
        message: 'Invalid Ethereum address'
      });
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'verifyAuthenticity',
        message: 'Invalid productId'
      });
    }

    // Call service
    const out = await contractService.verifyAuthenticity(
      signerAddress,
      Number(productId),
      String(notes)
    );

    return res.json({
      success: true,
      isValid: !!out?.isValid,
      transactionHash: out?.txHash || null,
      message: out?.isValid ? 'Product is authentic' : 'Product failed authenticity check'
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'verifyAuthenticity'));
  }
}

/**
 * Perform quality check
 * POST /api/verification/quality
 * Body: { signerAddress, productId, qualityScore, notes }
 * - Requires RETAILER or REGULATOR
 */
async function performQualityCheck(req, res) {
  try {
    const { signerAddress, productId, qualityScore, notes = '' } = req.body || {};

    // Validate
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (productId === undefined || productId === null) missing.push('productId');
    if (qualityScore === undefined || qualityScore === null) missing.push('qualityScore');
    if (missing.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'performQualityCheck',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }
    if (!isValidAddress(signerAddress)) {
      return res.status(400).json({
        error: true, code: 400, context: 'performQualityCheck',
        message: 'Invalid Ethereum address'
      });
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'performQualityCheck',
        message: 'Invalid productId'
      });
    }
    const score = Number(qualityScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return res.status(400).json({
        error: true, code: 400, context: 'performQualityCheck',
        message: 'qualityScore must be a number between 0 and 100'
      });
    }

    // Role check: RETAILER or REGULATOR
    let roleVal = null;
    try { roleVal = await contractService.getUserRole(signerAddress); } catch (_) {}
    const roleNum = Number(roleVal);
    if (!(roleNum === ROLES.RETAILER || roleNum === ROLES.REGULATOR)) {
      return res.status(403).json({
        error: true, code: 403, context: 'performQualityCheck',
        message: 'Only RETAILER or REGULATOR can perform quality checks'
      });
    }

    // Execute
    const out = await contractService.performQualityCheck(
      signerAddress,
      Number(productId),
      score,
      String(notes)
    );

    return res.json({
      success: true,
      transactionHash: out?.txHash || null,
      passed: score >= 50, // simple heuristic; adjust if your contract emits pass/fail
      message: 'Quality check recorded'
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'performQualityCheck'));
  }
}

/**
 * Perform compliance check (Regulator only)
 * POST /api/verification/compliance
 * Body: { signerAddress, productId, compliant, certificateHash }
 */
async function checkCompliance(req, res) {
  try {
    const { signerAddress, productId, compliant, certificateHash = '' } = req.body || {};

    // Validate
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (productId === undefined || productId === null) missing.push('productId');
    if (compliant === undefined || compliant === null) missing.push('compliant');
    if (missing.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'checkCompliance',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }
    if (!isValidAddress(signerAddress)) {
      return res.status(400).json({
        error: true, code: 400, context: 'checkCompliance',
        message: 'Invalid Ethereum address'
      });
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'checkCompliance',
        message: 'Invalid productId'
      });
    }
    const compliantBool = (typeof compliant === 'boolean') ? compliant : (String(compliant).toLowerCase() === 'true');

    // Role check: REGULATOR only
    let roleVal = null;
    try { roleVal = await contractService.getUserRole(signerAddress); } catch (_) {}
    const roleNum = Number(roleVal);
    if (roleNum !== ROLES.REGULATOR) {
      return res.status(403).json({
        error: true, code: 403, context: 'checkCompliance',
        message: 'Only REGULATOR can perform compliance checks'
      });
    }

    // Execute
    const out = await contractService.checkCompliance(
      signerAddress,
      Number(productId),
      compliantBool,
      String(certificateHash || '')
    );

    return res.json({
      success: true,
      transactionHash: out?.txHash || null,
      compliant: compliantBool,
      message: `Product marked as ${compliantBool ? 'compliant' : 'non-compliant'}`
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'checkCompliance'));
  }
}

/**
 * Get verification history for a product
 * GET /api/verification/:productId
 */
async function getVerificationHistory(req, res) {
  try {
    const { productId } = req.params || {};
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'getVerificationHistory',
        message: 'Invalid productId'
      });
    }

    const verifications = await contractService.getVerificationHistory(Number(productId));

    // Normalize (best-effort, depends on your ABI/mock)
    const normalized = (verifications || []).map((v) => ({
      at: Number(v.at ?? v.timestamp ?? 0),
      by: v.by || v.actor || null,
      type: v.type || v.action || 'QUALITY_CHECK',
      details: v.meta || v.details || null
    }));

    return res.json({ success: true, verifications: normalized });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getVerificationHistory'));
  }
}

module.exports = {
  verifyAuthenticity,
  performQualityCheck,
  checkCompliance,
  getVerificationHistory
};
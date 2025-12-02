/**
 * Verification Controller
 * Handles product verification operations (authenticity, quality, compliance)
 */

const contractService = require('../services/contractService');
const { formatError } = require('../utils/errors');
const { isValidProductId, isValidAddress } = require('../utils/helpers');

/**
 * Verify product authenticity
 * POST /api/verification/authenticity
 * 
 * Body: { signerAddress, productId, notes }
 * 
 * Validates inputs, calls contractService.verifyAuthenticity(),
 * and returns verification result and transaction hash.
 */
async function verifyAuthenticity(req, res) {
  try {
    const { signerAddress, productId, notes = '' } = req.body;
    
    // Validate inputs
    if (!signerAddress || !isValidAddress(signerAddress)) {
      return res.status(400).json(formatError(new Error('Invalid signer address'), 'verifyAuthenticity'));
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'verifyAuthenticity'));
    }
    
    // Call contractService.verifyAuthenticity()
    const result = await contractService.verifyAuthenticity(signerAddress, productId, notes);
    
    // Return result with isValid boolean
    res.json({
      success: true,
      isValid: result.isValid,
      transactionHash: result.transactionHash,
      message: 'Product authenticity verified'
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'verifyAuthenticity'));
  }
}

/**
 * Perform quality check
 * POST /api/verification/quality
 * 
 * Body: { signerAddress, productId, qualityScore, notes }
 * 
 * Validates inputs (qualityScore must be 0-100), verifies signer has RETAILER or REGULATOR role,
 * calls contractService.performQualityCheck(), and returns transaction hash.
 */
async function performQualityCheck(req, res) {
  try {
    const { signerAddress, productId, qualityScore, notes = '' } = req.body;
    
    // Validate inputs
    if (!signerAddress || !isValidAddress(signerAddress)) {
      return res.status(400).json(formatError(new Error('Invalid signer address'), 'performQualityCheck'));
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'performQualityCheck'));
    }
    if (typeof qualityScore !== 'number' || qualityScore < 0 || qualityScore > 100) {
      return res.status(400).json(formatError(new Error('Quality score must be between 0 and 100'), 'performQualityCheck'));
    }
    
    // Check user role (must be RETAILER or REGULATOR)
    const hasRetailerRole = await contractService.hasRole(signerAddress, 2); // RETAILER = 2
    const hasRegulatorRole = await contractService.hasRole(signerAddress, 3); // REGULATOR = 3
    
    if (!hasRetailerRole && !hasRegulatorRole) {
      return res.status(403).json(formatError(new Error('You must be a RETAILER or REGULATOR to perform quality checks'), 'performQualityCheck'));
    }
    
    // Call contractService.performQualityCheck()
    const result = await contractService.performQualityCheck(signerAddress, productId, qualityScore, notes);
    
    // Build response message
    let message = `Quality check completed with score ${qualityScore}/100`;
    if (result.autoVerified && result.isAuthentic) {
      message += '. Product authenticity automatically verified!';
    }
    
    // Return transaction hash and authenticity status
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      qualityScore: qualityScore,
      passed: qualityScore >= 50,
      isAuthentic: result.isAuthentic || false,
      autoVerified: result.autoVerified || false,
      message: message
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'performQualityCheck'));
  }
}

/**
 * Perform compliance check (Regulator only)
 * POST /api/verification/compliance
 * 
 * Body: { signerAddress, productId, compliant, certificateHash }
 * 
 * Validates inputs, verifies signer has REGULATOR role,
 * calls contractService.checkCompliance(), and returns transaction hash.
 */
async function checkCompliance(req, res) {
  try {
    const { signerAddress, productId, compliant, certificateHash = '' } = req.body;
    
    // Validate inputs
    if (!signerAddress || !isValidAddress(signerAddress)) {
      return res.status(400).json(formatError(new Error('Invalid signer address'), 'checkCompliance'));
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'checkCompliance'));
    }
    if (typeof compliant !== 'boolean') {
      return res.status(400).json(formatError(new Error('compliant must be a boolean'), 'checkCompliance'));
    }
    
    // Check user role (must be REGULATOR)
    const hasRegulatorRole = await contractService.hasRole(signerAddress, 3); // REGULATOR = 3
    
    if (!hasRegulatorRole) {
      return res.status(403).json(formatError(new Error('You must be a REGULATOR to perform compliance checks'), 'checkCompliance'));
    }
    
    // Call contractService.checkCompliance()
    // This will auto-verify authenticity if both quality and compliance checks have passed
    const result = await contractService.checkCompliance(signerAddress, productId, compliant, certificateHash);
    
    // Build response message
    let message = `Product marked as ${compliant ? 'compliant' : 'non-compliant'}`;
    if (result.autoVerified) {
      message += '. Product authenticity automatically verified!';
    }
    
    // Return transaction hash and authenticity status
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      compliant: compliant,
      isAuthentic: result.isAuthentic || false,
      autoVerified: result.autoVerified || false,
      message: message
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'checkCompliance'));
  }
}

/**
 * Get verification history for a product
 * GET /api/verification/:productId
 * 
 * Validates product ID, calls contractService.getVerificationHistory() which already formats
 * verification records (converts types, timestamps), and returns verification history.
 */
async function getVerificationHistory(req, res) {
  try {
    const productId = parseInt(req.params.productId);
    
    // Validate productId
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'getVerificationHistory'));
    }
    
    // Call contractService.getVerificationHistory() (already formats verifications)
    const verifications = await contractService.getVerificationHistory(productId);
    
    // Return history
    res.json({
      success: true,
      verifications: verifications
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'getVerificationHistory'));
  }
}

module.exports = {
  verifyAuthenticity,
  performQualityCheck,
  checkCompliance,
  getVerificationHistory
};


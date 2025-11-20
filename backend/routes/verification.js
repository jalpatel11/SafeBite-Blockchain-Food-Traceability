// backend/routes/verification.js
/**
 * Verification Routes
 * Base path (in server.js): /api/verification
 *
 * Endpoints:
 *  POST /authenticity          -> verify product authenticity
 *  POST /quality               -> perform quality check (RETAILER or REGULATOR)
 *  POST /compliance            -> perform compliance check (REGULATOR)
 *  GET  /:productId            -> get verification history for a product
 */

const express = require('express');
const router = express.Router();

const {
  verifyAuthenticity,
  performQualityCheck,
  checkCompliance,
  getVerificationHistory
} = require('../controllers/verificationController');

// Verify authenticity (expects body: { signerAddress, productId, notes })
router.post('/authenticity', verifyAuthenticity);

// Quality check (expects body: { signerAddress, productId, qualityScore, notes })
router.post('/quality', performQualityCheck);

// Compliance check (expects body: { signerAddress, productId, compliant, certificateHash })
router.post('/compliance', checkCompliance);

// Verification history (param: :productId)
router.get('/:productId', getVerificationHistory);

module.exports = router;
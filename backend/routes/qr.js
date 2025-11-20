/**
 * QR Code Routes
 * API endpoints for QR code generation
 */

const express = require('express');
const router = express.Router();
const qrService = require('../services/qrService');
const { isValidProductId } = require('../utils/helpers');

/**
 * Generate QR code image
 * GET /api/qr/:productId
 * 
 * Returns QR code as image (PNG)
 */
router.get('/:productId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const baseUrl = req.query.baseUrl || process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    // Validate product ID
    if (!isValidProductId(productId)) {
      return res.status(400).json({ error: true, message: 'Invalid productId' });
    }

    // Generate QR image buffer
    const buffer = await qrService.generateQRCodeBuffer(productId, baseUrl);

    // Return image
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (error) {
    console.error('QR route error:', error);
    res.status(500).json({ error: error.message || 'QR generation failed' });
  }
});

/**
 * Get QR code data (JSON)
 * GET /api/qr/:productId/data
 * 
 * Returns QR code data as JSON (frontend can generate QR from this)
 */
router.get('/:productId/data', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const baseUrl = req.query.baseUrl || process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    // Validate product ID
    if (!isValidProductId(productId)) {
      return res.status(400).json({ error: true, message: 'Invalid productId' });
    }

    // Get QR data JSON
    const data = qrService.getQRCodeData(productId, baseUrl);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('QR data route error:', error);
    res.status(500).json({ error: error.message || 'QR data generation failed' });
  }
});

module.exports = router;
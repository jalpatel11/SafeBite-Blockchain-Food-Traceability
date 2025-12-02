/**
 * QR Code Service
 * Generates QR codes for products containing product ID and verification URL
 * 
 * This service handles QR code generation for products, allowing consumers
 * to scan codes and verify product authenticity through the frontend.
 */

const QRCode = require('qrcode');

class QRService {
  /**
   * Generate QR code data for a product
   * 
   * @param {number} productId - Product ID
   * @param {string} baseUrl - Base URL for verification (e.g., http://localhost:5173)
   * @returns {Promise<string>} QR code data URL string
   * 
   * Creates QR data object with productId and verification URL, converts to JSON string,
   * generates QR code image using QRCode.toDataURL(), and returns data URL string.
   */
  async generateQRCode(productId, baseUrl = 'http://localhost:5173') {
    // Create QR data object
    const qrData = this.getQRCodeData(productId, baseUrl);
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code image as data URL
    const dataURL = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });
    
    return dataURL;
  }

  /**
   * Generate QR code as image buffer
   * 
   * @param {number} productId - Product ID
   * @param {string} baseUrl - Base URL for verification
   * @returns {Promise<Buffer>} QR code image buffer
   * 
   * Creates QR data object, generates QR code using QRCode.toBuffer(),
   * and returns buffer for direct image response.
   */
  async generateQRCodeBuffer(productId, baseUrl = 'http://localhost:5173') {
    // Create QR data object
    const qrData = this.getQRCodeData(productId, baseUrl);
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code buffer
    const buffer = await QRCode.toBuffer(qrDataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });
    
    return buffer;
  }

  /**
   * Get QR code data as JSON (for frontend to generate QR)
   * 
   * @param {number} productId - Product ID
   * @param {string} baseUrl - Base URL for verification
   * @returns {Object} QR code data object
   * 
   * Returns JSON object with productId and verifyUrl.
   * Frontend can use this to generate QR code.
   */
  getQRCodeData(productId, baseUrl = 'http://localhost:5173') {
    return {
      productId: productId,
      verifyUrl: `${baseUrl}/verify/${productId}`
    };
  }
}

module.exports = new QRService();


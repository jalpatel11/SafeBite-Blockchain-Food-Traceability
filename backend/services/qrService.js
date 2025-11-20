/**
 * QR Code Service
 * Generates QR codes for products containing product ID and verification URL
 */

const QRCode = require('qrcode');

class QRService {
  /**
   * Generate QR code data for a product.
   * Returns an object with productId, verifyUrl, and the QR image (base64 data URL).
   */
  async generateQRCode(productId, baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173') {
    // create the verification URL (frontend will likely handle /verify/:id)
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify/${productId}`;

    // QR payload (can be extended with product meta if you want)
    const qrPayload = JSON.stringify({ productId, verifyUrl });

    // generate base64 data URL image
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M' });

    return { productId, verifyUrl, qr: qrDataUrl };
  }

  /**
   * Generate QR code as an image buffer (for sending image directly).
   */
  async generateQRCodeBuffer(productId, baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173') {
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify/${productId}`;
    const qrPayload = JSON.stringify({ productId, verifyUrl });
    const buffer = await QRCode.toBuffer(qrPayload, { errorCorrectionLevel: 'M' });
    return buffer;
  }

  /**
   * Return plain JSON data (no image) — useful if frontend handles rendering.
   */
  getQRCodeData(productId, baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173') {
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify/${productId}`;
    return { productId, verifyUrl };
  }
}

module.exports = new QRService();
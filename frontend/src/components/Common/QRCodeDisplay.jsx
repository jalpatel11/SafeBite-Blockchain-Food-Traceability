/**
 * QRCodeDisplay Component
 * Display QR code for a product
 * 
 * Generates and displays a QR code that can be scanned to verify a product.
 */

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrAPI } from '../../services/api';
import './QRCodeDisplay.css';

/**
 * QRCodeDisplay Component
 * 
 * @param {number} productId - Product ID
 * @param {number} size - QR code size in pixels (default: 200)
 * 
 * Fetches QR data from API or generates locally, displays QR code,
 * and provides download functionality.
 */
export default function QRCodeDisplay({ productId, size = 200 }) {
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch QR data from API or generate locally
   */
  useEffect(() => {
    const fetchQRData = async () => {
      if (!productId) {
        setError('Product ID is required');
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch from API first
        const response = await qrAPI.getData(productId);
        if (response.data.success) {
          setQrData(response.data.data);
        } else {
          // Fallback to local generation
          generateQRData();
        }
      } catch (err) {
        // If API fails, generate locally
        generateQRData();
      } finally {
        setIsLoading(false);
      }
    };

    /**
     * Generate QR data locally
     */
  const generateQRData = () => {
    const baseUrl = window.location.origin;
      setQrData({
      productId: productId,
      verifyUrl: `${baseUrl}/verify/${productId}`
      });
  };

    fetchQRData();
  }, [productId]);

  /**
   * Download QR code as PNG
   * Fetches QR code image from API and downloads it
   */
  const handleDownload = async () => {
    try {
      const response = await qrAPI.getImage(productId);
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `product-${productId}-qr.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      // Fallback: try to download from SVG
      const svg = document.querySelector(`#qr-code-${productId} svg`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `product-${productId}-qr.png`;
            link.href = downloadUrl;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
          });
        };
        img.src = url;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="qr-code-loading">
        <div className="loading-spinner-small"></div>
        <p>Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-code-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className="qr-code-display">
      <div id={`qr-code-${productId}`} className="qr-code-container">
        <QRCodeSVG
          value={JSON.stringify(qrData)}
          size={size}
          level="M"
          includeMargin={true}
        />
      </div>
      <div className="qr-code-info">
        <p className="qr-code-label">Product ID: {qrData.productId}</p>
        <button className="btn-download" onClick={handleDownload}>
          Download QR Code
        </button>
      </div>
    </div>
  );
}

/**
 * QRScanner Component
 * Component to scan QR codes for product verification
 * 
 * Uses html5-qrcode library to scan QR codes from camera feed
 * Handles camera permissions, scanning, and results
 */

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

/**
 * QRScanner Component
 * 
 * @param {Function} onScan - Callback function when QR code is successfully scanned
 *                            Receives the scanned data (product ID) as parameter
 * 
 * Features:
 * - Camera access with permission handling
 * - Real-time QR code scanning
 * - Start/stop scanning controls
 * - Error handling and user feedback
 * - Automatic cleanup on unmount
 */
export default function QRScanner({ onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scanAttemptsRef = useRef(0);

  /**
   * Cleanup scanner on unmount
   */
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  /**
   * Start scanning QR codes
   * Requests camera permission and initializes scanner
   */
  const startScanning = async () => {
    if (!scannerRef.current) {
      setError('Scanner container not found');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);
      scanAttemptsRef.current = 0;

      // Create Html5Qrcode instance
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      // Configuration for scanning
      const config = {
        fps: 10, // Frames per second
        qrbox: { width: 250, height: 250 }, // Scanning area size
        aspectRatio: 1.0 // Square aspect ratio
      };

      // Start scanning with camera
      // Try to get user-facing camera first, fallback to any camera
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras && cameras.length > 0) {
        // Prefer back camera (usually index 1) for better quality, fallback to first available
        const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;
        
        await html5QrCode.start(
          cameraId,
          config,
          (decodedText, decodedResult) => {
            // Success callback - QR code scanned
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error callback - scanning error (not a fatal error, just no QR code detected)
            // Only show error after multiple failed attempts
            scanAttemptsRef.current++;
            if (scanAttemptsRef.current > 10) {
              // This is normal - just means no QR code is in view
              // Don't show error for normal scanning attempts
            }
          }
        );

        setHasPermission(true);
      } else {
        throw new Error('No cameras found. Please ensure your device has a camera.');
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setIsScanning(false);
      
      // Handle specific error cases
      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        setError('Camera permission denied. Please allow camera access and try again.');
        setHasPermission(false);
      } else if (err.name === 'NotFoundError' || err.message.includes('camera')) {
        setError('No camera found. Please ensure your device has a camera.');
        setHasPermission(false);
      } else if (err.message.includes('NotReadableError') || err.message.includes('already in use')) {
        setError('Camera is already in use by another application. Please close other apps using the camera.');
        setHasPermission(false);
      } else {
        setError(err.message || 'Failed to start camera. Please try again.');
        setHasPermission(null);
      }
    }
  };

  /**
   * Stop scanning QR codes
   * Stops camera and cleans up scanner instance
   */
  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setError(null);
        scanAttemptsRef.current = 0;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Force cleanup even if stop fails
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  /**
   * Handle successful QR code scan
   * Extracts product ID and calls onScan callback
   * 
   * @param {string} decodedText - The decoded QR code text
   */
  const handleScanSuccess = (decodedText) => {
    try {
      console.log('QR Code scanned:', decodedText);
      let productId = null;
      
      // First, check if it's a URL and extract productId from URL
      if (decodedText.includes('/verify/')) {
        const match = decodedText.match(/\/verify\/(\d+)/);
        if (match && match[1]) {
          productId = match[1];
          console.log('Extracted productId from URL:', productId);
        }
      }
      
      // If not found in URL, try to parse as JSON
      if (!productId) {
        try {
          const parsed = JSON.parse(decodedText);
          // If QR code contains JSON with productId field
          if (parsed.productId !== undefined && parsed.productId !== null) {
            productId = parsed.productId;
            console.log('Extracted productId from JSON:', productId);
          } else if (parsed.id !== undefined && parsed.id !== null) {
            productId = parsed.id;
            console.log('Extracted productId from JSON (id field):', productId);
          }
        } catch (parseError) {
          // Not JSON, check if it's a plain number
          const numMatch = decodedText.match(/^(\d+)$/);
          if (numMatch && numMatch[1]) {
            productId = numMatch[1];
            console.log('Extracted productId as plain number:', productId);
          } else {
            // Use as-is if it looks like a valid product ID
            const trimmed = decodedText.trim();
            if (/^\d+$/.test(trimmed)) {
              productId = trimmed;
              console.log('Using decoded text as productId:', productId);
            }
          }
        }
      }

      // Validate productId
      if (!productId) {
        console.error('Could not extract productId from QR code:', decodedText);
        setError('Invalid QR code format. Could not extract product ID.');
        return;
      }

      // Convert to string and validate it's a number
      const productIdStr = productId.toString().trim();
      const productIdNum = parseInt(productIdStr, 10);
      
      if (isNaN(productIdNum) || productIdNum < 0) {
        console.error('Invalid productId extracted:', productIdStr);
        setError(`Invalid product ID: ${productIdStr}`);
        return;
      }

      // Stop scanning after successful scan
      stopScanning();

      // Call onScan callback with product ID
      if (onScan) {
        console.log('Calling onScan with productId:', productIdNum.toString());
        onScan(productIdNum.toString());
      }
    } catch (err) {
      console.error('Error processing scanned QR code:', err);
      setError('Failed to process scanned QR code. Please try again.');
    }
  };

  /**
   * Request camera permission
   * Attempts to get camera access to check permissions
   */
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Permission granted, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
      // Auto-start scanning after permission granted
      startScanning();
    } catch (err) {
      setHasPermission(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else {
        setError('Failed to access camera. Please check your browser settings.');
      }
    }
  };

  return (
    <div className="qr-scanner">
      <div className="qr-scanner-container">
        <div 
          ref={scannerRef} 
          id="qr-reader" 
          className={`qr-reader ${isScanning ? 'scanning' : ''}`}
        >
          {!isScanning && (
            <div className="qr-scanner-placeholder">
              <div className="qr-scanner-icon">📷</div>
              <p className="qr-scanner-text">
                {hasPermission === false 
                  ? 'Camera access denied' 
                  : 'Click "Start Scanning" to begin'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="qr-scanner-controls">
        {!isScanning ? (
          <button
            onClick={hasPermission === false ? requestPermission : startScanning}
            className="btn-scan btn-start"
            disabled={isScanning}
          >
            {hasPermission === false ? 'Grant Camera Permission' : 'Start Scanning'}
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="btn-scan btn-stop"
          >
            Stop Scanning
          </button>
        )}
      </div>

      {error && (
        <div className="qr-scanner-error">
          <p>{error}</p>
          {hasPermission === false && (
            <button
              onClick={requestPermission}
              className="btn-request-permission"
            >
              Request Permission
            </button>
          )}
        </div>
      )}

      {isScanning && (
        <div className="qr-scanner-hint">
          <p>Point your camera at the QR code</p>
        </div>
      )}
    </div>
  );
}


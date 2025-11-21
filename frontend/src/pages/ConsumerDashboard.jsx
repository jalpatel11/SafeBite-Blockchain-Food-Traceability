/**
 * Consumer Dashboard
 * Dashboard for consumers to verify products and view product information
 * 
 * Provides functionality for consumers to:
 * - Scan QR codes to verify products
 * - Enter product IDs manually
 * - View product details, journey, and provenance
 * - Verify product authenticity
 * - View verification history (quality checks, compliance, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import QRScanner from '../components/Verification/QRScanner';
import { productAPI, verificationAPI } from '../services/api';
import { formatDate, getStatusName, formatAddress } from '../utils/helpers';
import { VERIFICATION_TYPE_NAMES } from '../utils/constants';
import './ConsumerDashboard.css';

/**
 * Get verification type name from number
 * Handles both number and string types, and undefined values
 */
const getVerificationTypeName = (type) => {
  // Handle undefined or null
  if (type === undefined || type === null) {
    return 'Unknown Type';
  }
  
  // Convert to number if it's a string
  const typeNum = typeof type === 'string' ? parseInt(type, 10) : Number(type);
  
  // Check if it's a valid number
  if (isNaN(typeNum)) {
    return 'Unknown Type';
  }
  
  // Return the type name or fallback
  return VERIFICATION_TYPE_NAMES[typeNum] || `Type ${typeNum}`;
};

/**
 * ConsumerDashboard Component
 * 
 * Main dashboard for consumers with:
 * - QR code scanner for quick product verification
 * - Manual product ID input
 * - Complete product information display
 * - Journey timeline
 * - Provenance data
 * - Authenticity verification
 */
export default function ConsumerDashboard() {
  const { account, isConnected } = useWeb3();
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState(null);
  const [journey, setJourney] = useState([]);
  const [provenance, setProvenance] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(null);

  /**
   * Fetch complete product details including journey, provenance, transfers, and verification history
   * @param {string|number|null} id - Product ID to verify (optional, uses productId state if not provided)
   */
  const handleVerify = useCallback(async (id = null) => {
    const pid = id !== null ? parseInt(id) : parseInt(productId);
    
    // Validate product ID
    if (isNaN(pid) || (pid === 0 && id === null && !productId)) {
      if (id === null) {
        setError('Please enter a valid product ID');
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerifySuccess(null);
    setProduct(null);
    setJourney([]);
    setProvenance(null);
    setTransfers([]);
    setVerifications([]);

    try {
      // Fetch product details
      const productResponse = await productAPI.getById(pid);
      if (productResponse.data && productResponse.data.success) {
        setProduct(productResponse.data.product);
      } else {
        setError('Product not found');
        setIsLoading(false);
        return;
      }

      // Fetch journey (product movement timeline)
      try {
        const journeyResponse = await productAPI.getJourney(pid);
        if (journeyResponse.data && journeyResponse.data.success) {
          setJourney(journeyResponse.data.journey || []);
        }
      } catch (err) {
        console.error('Failed to fetch journey:', err);
      }

      // Fetch provenance (complete traceability data)
      try {
        const provenanceResponse = await productAPI.getProvenance(pid);
        if (provenanceResponse.data && provenanceResponse.data.success) {
          setProvenance(provenanceResponse.data.provenance);
        }
      } catch (err) {
        console.error('Failed to fetch provenance:', err);
      }

      // Fetch transfer history
      try {
        if (productResponse.data.product.transfers) {
          setTransfers(productResponse.data.product.transfers);
        }
      } catch (err) {
        console.error('Failed to fetch transfers:', err);
      }

      // Fetch verification history (quality checks, compliance, authenticity)
      try {
        const verifyResponse = await verificationAPI.getHistory(pid);
        if (verifyResponse.data && verifyResponse.data.success && verifyResponse.data.verifications) {
          setVerifications(verifyResponse.data.verifications);
        }
      } catch (err) {
        console.error('Failed to fetch verifications:', err);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch product information');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  /**
   * Handle QR scan - callback when QR code is scanned
   * @param {string} scannedData - The product ID from the scanned QR code
   */
  const handleScan = useCallback((scannedData) => {
    const id = parseInt(scannedData);
    if (id) {
      setProductId(id.toString());
      handleVerify(id.toString());
    }
  }, [handleVerify]);

  /**
   * Handle authenticity verification
   * Anyone can verify product authenticity - checks if product has metadataHash and valid producer
   */
  const handleVerifyAuthenticity = useCallback(async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet to verify authenticity');
      return;
    }

    if (!product || !product.id) {
      setError('No product selected');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerifySuccess(null);

    try {
      const response = await verificationAPI.verifyAuthenticity({
        signerAddress: account,
        productId: product.id,
        notes: 'Authenticity verification by consumer'
      });

      if (response.data && response.data.success) {
        if (response.data.isValid) {
          setVerifySuccess('Product verified as authentic!');
          // Refresh product data to show updated authenticity status
          setTimeout(() => {
            handleVerify(product.id);
          }, 2000);
        } else {
          setError('Product verification failed: Product does not meet authenticity criteria (missing metadata hash or invalid producer)');
        }
      } else {
        setError(response.data?.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify authenticity');
    } finally {
      setIsVerifying(false);
    }
  }, [account, isConnected, product, handleVerify]);

  return (
    <div className="consumer-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Product Verification</h1>
          <p className="dashboard-subtitle">
            Scan a QR code or enter a product ID to verify authenticity and view complete product information
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* QR Scanner Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Scan QR Code</h2>
            <p className="section-description">
              Point your camera at the product's QR code to quickly verify it
            </p>
          </div>
          <div className="qr-scanner-container">
            <QRScanner onScan={handleScan} />
          </div>
        </div>

        {/* Manual Input Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Or Enter Product ID</h2>
            <p className="section-description">
              Enter the product ID manually if you don't have a QR code
            </p>
          </div>
          <div className="input-group">
            <input
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter Product ID (e.g., 0, 1, 2...)"
              className="product-id-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
            />
            <button
              onClick={() => handleVerify()}
              disabled={isLoading}
              className="btn-verify"
            >
              {isLoading ? 'Loading...' : 'Verify Product'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Success Message */}
        {verifySuccess && (
          <div className="success-message">
            {verifySuccess}
          </div>
        )}

        {/* Product Details */}
        {product && (
          <>
            {/* Basic Product Information */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Product Information</h2>
              </div>
              <div className="product-info-grid">
                <div className="info-item">
                  <span className="info-label">Product ID:</span>
                  <span className="info-value">{product.productId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{product.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Batch ID:</span>
                  <span className="info-value">{product.batchId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Origin:</span>
                  <span className="info-value">{product.origin}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge status-${getStatusName(product.status).toLowerCase()}`}>
                    {getStatusName(product.status)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Producer:</span>
                  <span className="info-value address">{formatAddress(product.producer)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">{formatDate(product.createdAt)}</span>
                </div>
                {product.metadataHash && (
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Metadata Hash:</span>
                    <span className="info-value metadata-hash">{product.metadataHash}</span>
                  </div>
                )}
                <div className="info-item authenticity-item">
                  <span className="info-label">Authentic:</span>
                  <div className="authenticity-control">
                    <span className={`authenticity-badge ${product.isAuthentic ? 'verified' : 'not-verified'}`}>
                      {product.isAuthentic ? 'Verified' : 'Not Verified'}
                    </span>
                    {!product.isAuthentic && isConnected && (
                      <button
                        onClick={handleVerifyAuthenticity}
                        disabled={isVerifying}
                        className="btn-verify-authenticity"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify Authenticity'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Journey */}
            {journey.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Product Journey</h2>
                  <p className="section-description">
                    Timeline of the product's movement through the supply chain
                  </p>
                </div>
                <div className="journey-timeline">
                  {journey.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">{event}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer History */}
            {transfers.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Transfer History</h2>
                  <p className="section-description">
                    Complete history of product ownership transfers
                  </p>
                </div>
                <div className="transfer-list">
                  {transfers.map((transfer, index) => (
                    <div key={index} className="transfer-item">
                      <div className="transfer-from">
                        <strong>From:</strong> {formatAddress(transfer.from)}
                      </div>
                      <div className="transfer-to">
                        <strong>To:</strong> {formatAddress(transfer.to)}
                      </div>
                      <div className="transfer-date">
                        <strong>Date:</strong> {formatDate(transfer.timestamp)}
                      </div>
                      {transfer.shipmentDetails && (
                        <div className="transfer-details">
                          <strong>Details:</strong> {transfer.shipmentDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification History */}
            {verifications.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Verification History</h2>
                  <p className="section-description">
                    Quality checks, compliance verifications, and authenticity checks performed on this product
                  </p>
                </div>
                <div className="verification-list">
                  {verifications.map((verification, index) => (
                    <div key={index} className={`verification-item ${verification.result ? 'passed' : 'failed'}`}>
                      <div className="verification-type">
                        <span className="verification-badge">{getVerificationTypeName(verification.vType || verification.type)}</span>
                      </div>
                      <div className="verification-result">
                        <strong>Result:</strong>
                        <span className={verification.result ? 'result-passed' : 'result-failed'}>
                          {verification.result ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="verification-verifier">
                        <strong>Verified By:</strong> {formatAddress(verification.verifier)}
                      </div>
                      <div className="verification-date">
                        <strong>Date:</strong> {formatDate(verification.timestamp)}
                      </div>
                      {verification.notes && (
                        <div className="verification-notes">
                          <strong>Notes:</strong> {verification.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Provenance */}
            {provenance && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Complete Provenance</h2>
                  <p className="section-description">
                    Full blockchain record of all product events and transactions
                  </p>
                </div>
                <div className="provenance-container">
                  <pre className="provenance-data">
                    {JSON.stringify(provenance, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

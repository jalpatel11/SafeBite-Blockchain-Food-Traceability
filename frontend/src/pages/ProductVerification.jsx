/**
 * Product Verification Dashboard
 * Unified dashboard for verifying products with QR scanning, manual input,
 * and comprehensive product information including journey, provenance, transfers, and verifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import QRScanner from '../components/Verification/QRScanner';
import { productAPI, verificationAPI } from '../services/api';
import { formatDate, getStatusName, formatAddress } from '../utils/helpers';
import { VERIFICATION_TYPE_NAMES } from '../utils/constants';

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

export default function ProductVerification() {
  const [searchParams] = useSearchParams();
  const { productId: urlProductId } = useParams();
  const { account, isConnected } = useWeb3();
  const [productId, setProductId] = useState(urlProductId || '');
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

      // Fetch transfer history (may be included in product data or separate endpoint)
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

  // Check for productId in URL params and auto-verify if present
  useEffect(() => {
    // Handle URL param from route (e.g., /verify/123)
    if (urlProductId) {
      setProductId(urlProductId);
      handleVerify(urlProductId);
      return;
    }
    
    // Handle query param (e.g., /verify?productId=123)
    const idFromUrl = searchParams.get('productId');
    if (idFromUrl) {
      setProductId(idFromUrl);
      handleVerify(idFromUrl);
    }
  }, [urlProductId, searchParams, handleVerify]);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>Product Verification</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Scan a QR code or enter a product ID to verify authenticity and view complete product details, 
        journey through the supply chain, and verification history.
      </p>

      {/* QR Scanner */}
      <div style={{ marginBottom: '2rem' }}>
        <QRScanner onScan={handleScan} />
      </div>

      {/* Manual Input Form */}
      <div style={{ 
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Or Enter Product ID Manually</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Product ID
            </label>
            <input
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter Product ID (e.g., 0, 1, 2...)"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
            />
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={isLoading}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              backgroundColor: isLoading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'Loading...' : 'Verify Product'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Product Details */}
      {product && (
        <div>
          {/* Basic Product Information */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'white',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
              Product Information
            </h2>
            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Product ID:</strong>
                <span style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>{product.productId}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Name:</strong>
                <span style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>{product.name}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Batch ID:</strong>
                <span style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>{product.batchId}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Origin:</strong>
                <span style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>{product.origin}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Status:</strong>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  whiteSpace: 'nowrap'
                }}>
                  {getStatusName(product.status)}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Producer:</strong>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.9rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>
                  {formatAddress(product.producer)}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Current Owner:</strong>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.9rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>
                  {formatAddress(product.currentOwner)}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0', 
                borderBottom: '1px solid #eee',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <strong>Created:</strong>
                <span style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>{formatDate(product.createdAt)}</span>
              </div>
              {product.metadataHash && (
                <div style={{ 
                  padding: '0.5rem 0', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <strong>Metadata Hash:</strong>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem',
                    background: '#f5f5f5',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #ddd'
                  }}>
                    {product.metadataHash}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <strong>Authentic:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    backgroundColor: product.isAuthentic ? '#e8f5e9' : '#ffebee',
                    color: product.isAuthentic ? '#2e7d32' : '#c62828',
                    fontWeight: 'bold'
                  }}>
                    {product.isAuthentic ? 'Verified' : 'Not Verified'}
                  </span>
                  {!product.isAuthentic && isConnected && (
                    <button
                      onClick={handleVerifyAuthenticity}
                      disabled={isVerifying}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: isVerifying ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isVerifying ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Authenticity'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Messages */}
          {verifySuccess && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '4px',
              marginBottom: '1rem',
              borderLeft: '3px solid #4CAF50'
            }}>
              {verifySuccess}
            </div>
          )}

          {/* Product Journey */}
          {journey.length > 0 && (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Product Journey</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {journey.map((event, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    borderLeft: '3px solid #2196F3',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {event}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer History */}
          {transfers.length > 0 && (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Transfer History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {transfers.map((transfer, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    borderLeft: '3px solid #4CAF50'
                  }}>
                    <div><strong>From:</strong> {formatAddress(transfer.from)}</div>
                    <div><strong>To:</strong> {formatAddress(transfer.to)}</div>
                    <div><strong>Date:</strong> {formatDate(transfer.timestamp)}</div>
                    {transfer.shipmentDetails && (
                      <div><strong>Details:</strong> {transfer.shipmentDetails}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification History */}
          {verifications.length > 0 && (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Verification History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {verifications.map((verification, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${verification.result ? '#4CAF50' : '#f44336'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong>Type:</strong>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}>
                        {getVerificationTypeName(verification.vType || verification.type)}
                      </span>
                    </div>
                    <div><strong>Result:</strong> 
                      <span style={{
                        marginLeft: '0.5rem',
                        color: verification.result ? '#2e7d32' : '#c62828',
                        fontWeight: 'bold'
                      }}>
                        {verification.result ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <div><strong>Verified By:</strong> {formatAddress(verification.verifier)}</div>
                    <div><strong>Date:</strong> {formatDate(verification.timestamp)}</div>
                    {verification.notes && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.75rem', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}>
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
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Complete Provenance</h3>
              <div style={{ 
                border: '1px solid #eee', 
                borderRadius: '4px', 
                padding: '1rem',
                backgroundColor: '#fafafa',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: 0 }}>
                  {JSON.stringify(provenance, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Test Products */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Quick Test</h3>
        <p style={{ marginBottom: '0.5rem' }}>Try these product IDs:</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5].map((id) => (
            <button
              key={id}
              onClick={() => {
                setProductId(id.toString());
                handleVerify(id.toString());
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Product {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

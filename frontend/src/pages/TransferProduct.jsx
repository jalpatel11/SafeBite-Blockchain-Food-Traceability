/**
 * Transfer Product Page
 * Simple page for transferring products between stakeholders
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { transferAPI, productAPI } from '../services/api';
import { formatAddress, isValidAddress, formatDate } from '../utils/helpers';
import { TEST_ACCOUNTS } from '../utils/constants';

export default function TransferProduct() {
  const { account, isConnected } = useWeb3();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    productId: searchParams.get('productId') || '',
    toAddress: '',
    shipmentDetails: ''
  });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);

  /**
   * Fetch product details when productId changes or on mount
   */
  useEffect(() => {
    if (formData.productId) {
      fetchProductDetails();
    }
  }, [formData.productId]);

  /**
   * Update form when URL params change
   */
  useEffect(() => {
    const productIdFromUrl = searchParams.get('productId');
    if (productIdFromUrl && productIdFromUrl !== formData.productId) {
      setFormData(prev => ({
        ...prev,
        productId: productIdFromUrl
      }));
    }
  }, [searchParams]);

  /**
   * Fetch product details
   */
  const fetchProductDetails = async () => {
    const pid = parseInt(formData.productId);
    if (!pid && pid !== 0) return;

    setIsLoading(true);
    try {
      const response = await productAPI.getById(pid);
      if (response.data && response.data.success) {
        setProduct(response.data.product);
          // Fetch transfer history
          try {
            const transferResponse = await transferAPI.getHistory(pid);
            if (transferResponse.data && transferResponse.data.success) {
              setTransferHistory(transferResponse.data.transfers || []);
            }
          } catch (err) {
            console.error('Failed to fetch transfer history:', err);
            setTransferHistory([]);
          }
      } else {
        setProduct(null);
        setError('Product not found');
      }
    } catch (err) {
      setProduct(null);
      setError('Failed to fetch product details');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form input change
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'productId') {
      setProduct(null);
      setError(null);
    }
  };

  /**
   * Handle recipient address selection from dropdown
   */
  const handleRecipientSelect = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'custom') {
      setUseCustomAddress(true);
      setFormData({
        ...formData,
        toAddress: ''
      });
    } else {
      setUseCustomAddress(false);
      setFormData({
        ...formData,
        toAddress: selectedValue
      });
    }
  };

  /**
   * Handle switching back to dropdown from custom input
   */
  const handleSwitchToDropdown = () => {
    setUseCustomAddress(false);
    setFormData({
      ...formData,
      toAddress: ''
    });
  };

  /**
   * Handle transfer
   */
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsTransferring(true);

    // Validate
    if (!formData.productId || !formData.toAddress) {
      setError('Please fill in Product ID and Recipient Address');
      setIsTransferring(false);
      return;
    }

    if (!isValidAddress(formData.toAddress)) {
      setError('Invalid recipient address format');
      setIsTransferring(false);
      return;
    }

    if (!product) {
      setError('Please verify product ID first');
      setIsTransferring(false);
      return;
    }

    if (product.currentOwner?.toLowerCase() !== account?.toLowerCase()) {
      setError(`You are not the current owner. Current owner: ${formatAddress(product.currentOwner)}`);
      setIsTransferring(false);
      return;
    }

    try {
      const response = await transferAPI.transfer({
        signerAddress: account,
        productId: parseInt(formData.productId),
        toAddress: formData.toAddress,
        shipmentDetails: formData.shipmentDetails || ''
      });

      if (response.data && response.data.success) {
        setSuccess(`Transfer successful! ${response.data.transactionHash ? `Transaction: ${response.data.transactionHash}` : ''}`);
        setFormData({ productId: '', toAddress: '', shipmentDetails: '' });
        setProduct(null);
        setTransferHistory([]);
        // Refresh after delay
        setTimeout(() => {
          if (formData.productId) {
            fetchProductDetails();
          }
        }, 2000);
      } else {
        setError(response.data?.message || 'Transfer failed');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to transfer product');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Transfer Product</h1>
        <p>Please connect your wallet to transfer products.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Transfer Product</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Transfer product ownership to another stakeholder in the supply chain.
      </p>

      {/* Transfer Form */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>Transfer Form</h2>
        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Product ID *
            </label>
            <input
              type="number"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              placeholder="Enter Product ID"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <button
              type="button"
              onClick={fetchProductDetails}
              disabled={isLoading || !formData.productId}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isLoading ? 'Loading...' : 'Verify Product'}
            </button>
          </div>

          {/* Product Info Display */}
          {product && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ marginTop: 0 }}>{product.name}</h3>
              <p><strong>Current Owner:</strong> {formatAddress(product.currentOwner)}</p>
              <p><strong>Your Address:</strong> {formatAddress(account)}</p>
              {product.currentOwner?.toLowerCase() === account?.toLowerCase() ? (
                <p style={{ color: 'green' }}>You are the current owner</p>
              ) : (
                <p style={{ color: 'red' }}>You are not the current owner</p>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Recipient Address *
            </label>
            
            {!useCustomAddress ? (
              <>
                <select
                  name="toAddress"
                  value={formData.toAddress}
                  onChange={handleRecipientSelect}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select a recipient...</option>
                  {TEST_ACCOUNTS.map((account) => (
                    <option key={account.address} value={account.address}>
                      {account.label} - {account.roleName}
                    </option>
                  ))}
                  <option value="custom">Enter custom address...</option>
                </select>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                  Select from test accounts or choose to enter a custom address
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSwitchToDropdown}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ← Back to dropdown
                  </button>
                </div>
                <input
                  type="text"
                  name="toAddress"
                  value={formData.toAddress}
                  onChange={handleChange}
                  required
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                  Must be a DISTRIBUTOR, RETAILER, or CONSUMER address
                </p>
              </>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Shipment Details (Optional)
            </label>
            <textarea
              name="shipmentDetails"
              value={formData.shipmentDetails}
              onChange={handleChange}
              placeholder="Tracking number, carrier, delivery date, etc."
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '4px'
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isTransferring || !product || product.currentOwner?.toLowerCase() !== account?.toLowerCase()}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              backgroundColor: (isTransferring || !product || product.currentOwner?.toLowerCase() !== account?.toLowerCase()) ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (isTransferring || !product || product.currentOwner?.toLowerCase() !== account?.toLowerCase()) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Product'}
          </button>
        </form>
      </div>

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: 'white'
        }}>
          <h2 style={{ marginTop: 0 }}>Transfer History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transferHistory.map((transfer, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  borderLeft: '3px solid #4CAF50'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  <strong>From:</strong>
                  <span style={{ fontFamily: 'monospace' }}>{formatAddress(transfer.from)}</span>
                  <strong>To:</strong>
                  <span style={{ fontFamily: 'monospace' }}>{formatAddress(transfer.to)}</span>
                  <strong>Date:</strong>
                  <span>{formatDate(transfer.timestamp || transfer.createdAt)}</span>
                  {transfer.shipmentDetails && (
                    <>
                      <strong>Details:</strong>
                      <span>{transfer.shipmentDetails}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>How Transfer Works</h3>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Enter the Product ID and click "Verify Product" to check ownership</li>
          <li>Enter the recipient's wallet address (must have DISTRIBUTOR, RETAILER, or CONSUMER role)</li>
          <li>Optionally add shipment details (tracking number, carrier, etc.)</li>
          <li>Click "Transfer Product" and confirm in MetaMask</li>
          <li>Product ownership and status will update automatically</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <strong>Note:</strong> Only the current owner can transfer a product. 
          The product status will automatically update based on the recipient's role.
        </p>
      </div>
    </div>
  );
}


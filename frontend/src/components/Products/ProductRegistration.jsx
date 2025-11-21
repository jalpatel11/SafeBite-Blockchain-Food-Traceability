/**
 * ProductRegistration Component
 * Form to register a new product (Producer only)
 * 
 * Handles product registration with validation, API calls, and QR code generation.
 */

import { useState } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import { useRole } from '../../hooks/useRole';
import { productAPI } from '../../services/api';
import { STATUS_NAMES, PRODUCT_STATUS } from '../../utils/constants';
import './ProductRegistration.css';

/**
 * ProductRegistration Component
 * 
 * Provides a form for producers to register new products with:
 * - Product name, batch ID, origin, and optional metadata hash
 * - Form validation
 * - Transaction status feedback
 * - QR code generation after successful registration
 */
export default function ProductRegistration({ onProductRegistered }) {
  const { account, isConnected } = useWeb3();
  const { role } = useRole();
  const [formData, setFormData] = useState({
    name: '',
    batchId: '',
    origin: '',
    metadataHash: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [registeredProduct, setRegisteredProduct] = useState(null);

  /**
   * Handle form input changes
   * Updates form state and clears errors
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(null);
  };

  /**
   * Validate form data before submission
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.batchId.trim()) {
      setError('Batch ID is required');
      return false;
    }
    if (!formData.origin.trim()) {
      setError('Origin is required');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   * Validates form, calls API to register product, handles response
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRegisteredProduct(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await productAPI.register({
        signerAddress: account,
        name: formData.name.trim(),
        batchId: formData.batchId.trim(),
        origin: formData.origin.trim(),
        metadataHash: formData.metadataHash.trim() || ''
      });

      if (response.data.success) {
        setSuccess(`Product registered successfully! Product ID: ${response.data.productId}`);
        setRegisteredProduct({
          productId: response.data.productId,
          transactionHash: response.data.transactionHash,
          qrCode: response.data.qrCode
        });
        
        // Reset form
        setFormData({
          name: '',
          batchId: '',
          origin: '',
          metadataHash: ''
        });

        // Notify parent component
        if (onProductRegistered) {
          onProductRegistered(response.data.productId);
        }
      } else {
        setError('Failed to register product');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register product';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is producer
  if (!isConnected || role !== 0) {
    return (
      <div className="product-registration-error">
        <p>You must be a Producer to register products</p>
      </div>
    );
  }

  return (
    <div className="product-registration">
      <div className="product-registration-header">
        <h2>Register New Product</h2>
        <p>Register a new product to track it through the supply chain</p>
      </div>

      <form onSubmit={handleSubmit} className="product-registration-form">
        <div className="form-group">
          <label htmlFor="name">
            Product Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Organic Apples"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchId">
            Batch ID <span className="required">*</span>
          </label>
          <input
            type="text"
            id="batchId"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            placeholder="e.g., BATCH-2024-001"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="origin">
            Origin <span className="required">*</span>
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            placeholder="e.g., California, USA"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="metadataHash">
            Metadata Hash (Optional)
          </label>
          <input
            type="text"
            id="metadataHash"
            name="metadataHash"
            value={formData.metadataHash}
            onChange={handleChange}
            placeholder="IPFS hash or certificate reference"
            disabled={isLoading}
          />
          <small>Optional: IPFS hash or reference to certificates, quality reports, etc.</small>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <strong>Success:</strong> {success}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register Product'}
        </button>
      </form>

      {registeredProduct && (
        <div className="registration-success">
          <div className="success-card">
            <h3>Product Registered Successfully!</h3>
            <div className="product-info">
              <p><strong>Product ID:</strong> {registeredProduct.productId}</p>
              <p><strong>Transaction Hash:</strong></p>
              <code className="transaction-hash">{registeredProduct.transactionHash}</code>
            </div>
            {registeredProduct.qrCode && (
              <div className="qr-code-preview">
                <h4>QR Code</h4>
                <img 
                  src={registeredProduct.qrCode} 
                  alt={`QR Code for Product ${registeredProduct.productId}`}
                  className="qr-code-image"
                />
                <p className="qr-code-note">Scan this QR code to verify the product</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ProductCard Component
 * Displays a product card with key information
 */

import { useState } from 'react';
import { STATUS_NAMES, PRODUCT_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import QRCodeDisplay from '../Common/QRCodeDisplay';
import './ProductCard.css';

/**
 * ProductCard Component
 * 
 * @param {Object} product - Product data object
 * @param {Function} onViewDetails - Callback when view details is clicked
 * @param {Function} onTransfer - Callback when transfer is clicked
 * @param {Function} onQualityCheck - Callback when quality check is clicked (optional)
 * @param {string} currentAccount - Current user's wallet address (optional)
 * 
 * Displays product information in a card format with:
 * - Product name and ID
 * - Batch ID and origin
 * - Current status
 * - Ownership indicator
 * - Quick actions (view details, QR code, transfer, quality check)
 */
export default function ProductCard({ product, onViewDetails, onTransfer, onQualityCheck, onComplianceCheck, currentAccount, userRole }) {
  const [showQR, setShowQR] = useState(false);

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      [PRODUCT_STATUS.CREATED]: 'status-created',
      [PRODUCT_STATUS.SHIPPED]: 'status-shipped',
      [PRODUCT_STATUS.RECEIVED]: 'status-received',
      [PRODUCT_STATUS.STORED]: 'status-stored',
      [PRODUCT_STATUS.DELIVERED]: 'status-delivered'
    };
    return statusClasses[status] || 'status-unknown';
  };


  return (
    <div className="product-card">
      <div className="product-card-header">
        <div className="product-title">
          <h3>{product.name || 'Unnamed Product'}</h3>
          <span className="product-id">ID: {product.id}</span>
        </div>
        <span className={`status-badge ${getStatusBadgeClass(product.status)}`}>
          {STATUS_NAMES[product.status] || 'Unknown'}
        </span>
      </div>

      <div className="product-card-body">
        <div className="product-info-row">
          <span className="info-label">Batch ID:</span>
          <span className="info-value">{product.batchId || 'N/A'}</span>
        </div>
        <div className="product-info-row">
          <span className="info-label">Origin:</span>
          <span className="info-value">{product.origin || 'N/A'}</span>
        </div>
        <div className="product-info-row">
          <span className="info-label">Created:</span>
          <span className="info-value">{formatDate(product.createdAt)}</span>
        </div>
        {currentAccount && product.currentOwner && (
          <div className="product-info-row">
            <span className="info-label">Ownership:</span>
            <span className={`info-value ${product.currentOwner.toLowerCase() === currentAccount.toLowerCase() ? 'ownership-current' : 'ownership-transferred'}`}>
              {product.currentOwner.toLowerCase() === currentAccount.toLowerCase() 
                ? 'You are the current owner' 
                : 'Transferred to another party'}
            </span>
          </div>
        )}
        {product.isAuthentic !== undefined && (
          <div className="product-info-row">
            <span className="info-label">Authentic:</span>
            <span className={`info-value ${product.isAuthentic ? 'authentic-yes' : 'authentic-no'}`}>
              {product.isAuthentic ? 'Verified' : 'Not verified'}
            </span>
          </div>
        )}
      </div>

      <div className="product-card-actions">
        <button
          className="btn btn-secondary"
          onClick={() => onViewDetails && onViewDetails(product.id)}
        >
          View Details
        </button>
        {onTransfer && currentAccount && product.currentOwner && 
         product.currentOwner.toLowerCase() === currentAccount.toLowerCase() && (
          <button
            className="btn btn-primary"
            onClick={() => onTransfer(product.id)}
          >
            Transfer
          </button>
        )}
        {onQualityCheck && (
          // Regulators can perform quality checks on any product
          // Retailers can only check products they own
          (userRole === 3 || (currentAccount && product.currentOwner && 
           product.currentOwner.toLowerCase() === currentAccount.toLowerCase())) && (
            <button
              className="btn btn-quality"
              onClick={() => onQualityCheck(product.id)}
            >
              Quality Check
            </button>
          )
        )}
        {onComplianceCheck && userRole === 3 && (
          <button
            className="btn btn-compliance"
            onClick={() => onComplianceCheck(product.id)}
          >
            Compliance Check
          </button>
        )}
        <button
          className="btn btn-outline"
          onClick={() => setShowQR(!showQR)}
        >
          {showQR ? 'Hide QR' : 'Show QR Code'}
        </button>
      </div>

      {showQR && (
        <div className="product-card-qr">
          <QRCodeDisplay productId={product.id} />
        </div>
      )}
    </div>
  );
}


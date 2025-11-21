/**
 * Retailer Dashboard
 * Dashboard for retailers to manage inventory and quality checks
 * 
 * Provides functionality for retailers to:
 * - View products in their inventory
 * - Perform quality checks on products
 * - Transfer products to consumers
 * - View product details and journey
 */

import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/Products/ProductList';
import QualityCheck from '../components/Verification/QualityCheck';
import './RetailerDashboard.css';

/**
 * RetailerDashboard Component
 * 
 * Main dashboard for retailers with:
 * - List of products currently owned by retailer
 * - Quality check functionality
 * - Transfer functionality to consumers
 * - Product details and journey tracking
 */
export default function RetailerDashboard() {
  const { account, isConnected } = useWeb3();
  const { role, roleName } = useRole();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProductForQuality, setSelectedProductForQuality] = useState(null);

  /**
   * Handle product card click
   * Navigates to product details/verification page
   */
  const handleProductClick = (productId) => {
    navigate(`/verify/${productId}`);
  };

  /**
   * Handle product transfer
   * Navigates to transfer page with product ID
   */
  const handleProductTransfer = (productId) => {
    navigate(`/transfer?productId=${productId}`);
  };

  /**
   * Handle quality check button click
   * Opens quality check form for the selected product
   */
  const handleQualityCheckClick = (productId) => {
    setSelectedProductForQuality(productId);
  };

  /**
   * Handle quality check completion
   * Refreshes product list and closes quality check form
   */
  const handleQualityCheckComplete = (productId, score, passed) => {
    setRefreshKey(prev => prev + 1);
    // Keep quality check open to show success message, close after delay
    setTimeout(() => {
      setSelectedProductForQuality(null);
    }, 3000);
  };

  /**
   * Close quality check form
   */
  const handleCloseQualityCheck = () => {
    setSelectedProductForQuality(null);
  };

  // Check if wallet is connected
  if (!isConnected) {
    return (
      <div className="retailer-dashboard">
        <div className="dashboard-error">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to access the Retailer Dashboard</p>
        </div>
      </div>
    );
  }

  // Check if user has RETAILER role
  if (role !== 2) {
    return (
      <div className="retailer-dashboard">
        <div className="dashboard-error">
          <h2>Access Denied</h2>
          <p>You must be a Retailer to access this dashboard.</p>
          <p>Your current role: {roleName || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retailer-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Retailer Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage inventory, perform quality checks, and transfer products to consumers
          </p>
        </div>
        <div className="dashboard-info">
          <div className="info-item">
            <span className="info-label">Account:</span>
            <span className="info-value">{account}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Role:</span>
            <span className="info-value">{roleName}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Inventory</h2>
            <p className="section-description">
              Products currently in your inventory. Perform quality checks and transfer to consumers.
            </p>
          </div>
          <ProductList
            key={refreshKey}
            ownerAddress={account}
            currentAccount={account}
            userRole={role}
            onProductClick={handleProductClick}
            onProductTransfer={handleProductTransfer}
            onQualityCheck={handleQualityCheckClick}
          />
        </div>

        {selectedProductForQuality && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Quality Check</h2>
              <button
                className="btn-close"
                onClick={handleCloseQualityCheck}
                title="Close"
              >
                ×
              </button>
            </div>
            <QualityCheck
              productId={selectedProductForQuality}
              signerAddress={account}
              onQualityCheckComplete={handleQualityCheckComplete}
            />
          </div>
        )}

        <div className="dashboard-section">
          <div className="info-box">
            <h3>How It Works</h3>
            <ul>
              <li>
                <strong>Receive Products:</strong> Distributors transfer products to you, and they appear in your inventory with status "RECEIVED"
              </li>
              <li>
                <strong>Perform Quality Checks:</strong> Click "Quality Check" on any product to assess its quality (score 0-100). Products with score ≥50 pass.
              </li>
              <li>
                <strong>Transfer to Consumers:</strong> After quality checks, transfer products to consumers, which sets the status to "DELIVERED"
              </li>
              <li>
                <strong>Track Products:</strong> View complete product journey and provenance for any product in your inventory
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


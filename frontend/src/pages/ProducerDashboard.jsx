/**
 * Producer Dashboard
 * Dashboard for producers to register and manage products
 * 
 * Provides a comprehensive interface for producers to:
 * - Register new products
 * - View all registered products
 * - View product details
 * - Generate QR codes
 */

import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import ProductRegistration from '../components/Products/ProductRegistration';
import ProductList from '../components/Products/ProductList';
import './ProducerDashboard.css';

/**
 * ProducerDashboard Component
 * 
 * Main dashboard for producers with:
 * - Product registration form
 * - List of products owned by producer
 * - Search and filter functionality
 * - Navigation to product details
 */
export default function ProducerDashboard() {
  const { account, isConnected } = useWeb3();
  const { role, roleName } = useRole();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle product registration success
   * Refreshes the product list
   */
  const handleProductRegistered = (productId) => {
    // Trigger refresh of product list
    setRefreshKey(prev => prev + 1);
  };

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

  // Check if wallet is connected
  if (!isConnected) {
    return (
      <div className="producer-dashboard">
        <div className="dashboard-error">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to access the Producer Dashboard</p>
        </div>
      </div>
    );
  }

  // Check if user has PRODUCER role
  if (role !== 0) {
    return (
      <div className="producer-dashboard">
        <div className="dashboard-error">
          <h2>Access Denied</h2>
          <p>You must be a Producer to access this dashboard.</p>
          <p>Your current role: {roleName || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="producer-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Producer Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your products and track them through the supply chain
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
          <ProductRegistration onProductRegistered={handleProductRegistered} />
        </div>

        <div className="dashboard-section">
          <ProductList
            key={refreshKey}
            producerAddress={account}
            currentAccount={account}
            userRole={role}
            onProductClick={handleProductClick}
            onProductTransfer={handleProductTransfer}
          />
        </div>
      </div>
    </div>
  );
}

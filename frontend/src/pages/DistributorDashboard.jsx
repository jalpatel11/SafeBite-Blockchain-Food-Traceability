/**
 * Distributor Dashboard
 * Dashboard for distributors to manage products in transit
 * 
 * Provides functionality for distributors to:
 * - View products they currently own
 * - Transfer products to retailers or consumers
 * - View product details and journey
 * - Track shipment information
 */

import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/Products/ProductList';
import './DistributorDashboard.css';

/**
 * DistributorDashboard Component
 * 
 * Main dashboard for distributors with:
 * - List of products currently owned by distributor
 * - Transfer functionality to retailers/consumers
 * - Product details and journey tracking
 * - Search and filter functionality
 */
export default function DistributorDashboard() {
  const { account, isConnected } = useWeb3();
  const { role, roleName } = useRole();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

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
   * Handle refresh
   * Triggers a refresh of the product list
   */
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if wallet is connected
  if (!isConnected) {
    return (
      <div className="distributor-dashboard">
        <div className="dashboard-error">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to access the Distributor Dashboard</p>
        </div>
      </div>
    );
  }

  // Check if user has DISTRIBUTOR role
  if (role !== 1) {
    return (
      <div className="distributor-dashboard">
        <div className="dashboard-error">
          <h2>Access Denied</h2>
          <p>You must be a Distributor to access this dashboard.</p>
          <p>Your current role: {roleName || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="distributor-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Distributor Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage products in transit and transfer them to retailers or consumers
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
              Products currently in your possession. Transfer them to retailers or consumers to move them through the supply chain.
            </p>
          </div>
          <ProductList
            key={refreshKey}
            ownerAddress={account}
            currentAccount={account}
            userRole={role}
            onProductClick={handleProductClick}
            onProductTransfer={handleProductTransfer}
          />
        </div>

        <div className="dashboard-section">
          <div className="info-box">
            <h3>How It Works</h3>
            <ul>
              <li>
                <strong>Receive Products:</strong> Producers transfer products to you, and they appear in your inventory with status "SHIPPED"
              </li>
              <li>
                <strong>Transfer to Retailer:</strong> When you transfer a product to a retailer, the status automatically changes to "RECEIVED"
              </li>
              <li>
                <strong>Transfer to Consumer:</strong> You can also transfer directly to consumers, which sets the status to "DELIVERED"
              </li>
              <li>
                <strong>Track Shipments:</strong> Add shipment details (tracking number, carrier, etc.) when transferring products
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

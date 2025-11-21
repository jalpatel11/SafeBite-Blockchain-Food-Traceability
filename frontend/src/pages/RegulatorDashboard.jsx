/**
 * Regulator Dashboard
 * Dashboard for regulators to perform compliance checks and audits
 * 
 * Provides functionality for regulators to:
 * - View all products in the system
 * - Perform compliance checks on products
 * - Perform quality checks on products
 * - View verification history and audit reports
 */

import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/Products/ProductList';
import ComplianceCheck from '../components/Verification/ComplianceCheck';
import QualityCheck from '../components/Verification/QualityCheck';
import './RegulatorDashboard.css';

/**
 * RegulatorDashboard Component
 * 
 * Main dashboard for regulators with:
 * - List of all products in the system (not filtered by ownership)
 * - Compliance check functionality
 * - Quality check functionality
 * - Access to verification history and audit reports
 */
export default function RegulatorDashboard() {
  const { account, isConnected } = useWeb3();
  const { role, roleName } = useRole();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProductForCompliance, setSelectedProductForCompliance] = useState(null);
  const [selectedProductForQuality, setSelectedProductForQuality] = useState(null);
  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance' or 'quality'

  /**
   * Handle product card click
   * Navigates to product details/verification page
   */
  const handleProductClick = (productId) => {
    navigate(`/verify/${productId}`);
  };

  /**
   * Handle compliance check button click
   * Opens compliance check form for the selected product
   */
  const handleComplianceCheckClick = (productId) => {
    setSelectedProductForCompliance(productId);
    setActiveTab('compliance');
    setSelectedProductForQuality(null);
  };

  /**
   * Handle quality check button click
   * Opens quality check form for the selected product
   */
  const handleQualityCheckClick = (productId) => {
    setSelectedProductForQuality(productId);
    setActiveTab('quality');
    setSelectedProductForCompliance(null);
  };

  /**
   * Handle compliance check completion
   * Refreshes product list and closes compliance check form
   */
  const handleComplianceCheckComplete = (productId, compliant) => {
    setRefreshKey(prev => prev + 1);
    // Keep compliance check open to show success message, close after delay
    setTimeout(() => {
      setSelectedProductForCompliance(null);
    }, 3000);
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
   * Close compliance check form
   */
  const handleCloseComplianceCheck = () => {
    setSelectedProductForCompliance(null);
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
      <div className="regulator-dashboard">
        <div className="dashboard-error">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to access the Regulator Dashboard</p>
        </div>
      </div>
    );
  }

  // Check if user has REGULATOR role
  if (role !== 3) {
    return (
      <div className="regulator-dashboard">
        <div className="dashboard-error">
          <h2>Access Denied</h2>
          <p>You must be a Regulator to access this dashboard.</p>
          <p>Your current role: {roleName || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="regulator-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Regulator Dashboard</h1>
          <p className="dashboard-subtitle">
            Perform compliance checks, quality assessments, and audit all products in the system
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
            <h2>All Products</h2>
            <p className="section-description">
              View all products in the system. Perform compliance checks and quality assessments on any product.
            </p>
          </div>
          <ProductList
            key={refreshKey}
            currentAccount={account}
            userRole={role}
            onProductClick={handleProductClick}
            onComplianceCheck={handleComplianceCheckClick}
            onQualityCheck={handleQualityCheckClick}
          />
        </div>

        {(selectedProductForCompliance || selectedProductForQuality) && (
          <div className="dashboard-section">
            <div className="section-header">
              <div className="tab-buttons">
                <button
                  className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedProductForCompliance) {
                      setActiveTab('compliance');
                      setSelectedProductForQuality(null);
                    }
                  }}
                  disabled={!selectedProductForCompliance}
                >
                  Compliance Check
                </button>
                <button
                  className={`tab-button ${activeTab === 'quality' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedProductForQuality) {
                      setActiveTab('quality');
                      setSelectedProductForCompliance(null);
                    }
                  }}
                  disabled={!selectedProductForQuality}
                >
                  Quality Check
                </button>
              </div>
              <button
                className="btn-close"
                onClick={() => {
                  handleCloseComplianceCheck();
                  handleCloseQualityCheck();
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            {activeTab === 'compliance' && selectedProductForCompliance && (
              <ComplianceCheck
                productId={selectedProductForCompliance}
                signerAddress={account}
                onComplianceCheckComplete={handleComplianceCheckComplete}
              />
            )}
            {activeTab === 'quality' && selectedProductForQuality && (
              <QualityCheck
                productId={selectedProductForQuality}
                signerAddress={account}
                onQualityCheckComplete={handleQualityCheckComplete}
              />
            )}
          </div>
        )}

        <div className="dashboard-section">
          <div className="info-box">
            <h3>Regulator Responsibilities</h3>
            <ul>
              <li>
                <strong>Compliance Checks:</strong> Mark products as compliant or non-compliant with regulatory standards. 
                Add certificate hashes for compliant products.
              </li>
              <li>
                <strong>Quality Assessments:</strong> Perform quality checks on products (score 0-100). 
                Products with score ≥50 pass quality standards.
              </li>
              <li>
                <strong>System-Wide Access:</strong> View all products in the system, regardless of ownership, 
                to perform audits and compliance verification.
              </li>
              <li>
                <strong>Audit Trail:</strong> All compliance and quality checks are permanently recorded on the blockchain 
                and visible to consumers during product verification.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


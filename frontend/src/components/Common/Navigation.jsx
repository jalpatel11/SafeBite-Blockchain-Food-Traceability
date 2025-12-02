/**
 * Navigation Component
 * Main navigation bar with role-based dashboard links and wallet connection
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../hooks/useWeb3';
import { useRole } from '../../hooks/useRole';
import { ROLE_NAMES, ROLES } from '../../utils/constants';
import { formatAddress } from '../../utils/helpers';
import './Navigation.css';

/**
 * Navigation Component
 * 
 * Displays navigation links based on user's role and connection status.
 * Includes wallet connection UI integrated into the navigation bar.
 */
export default function Navigation() {
  const { account, isConnected, isLoading, connect, disconnect } = useWeb3();
  const { role, roleName } = useRole();
  const location = useLocation();
  const [error, setError] = useState(null);

  /**
   * Handle connect button click
   */
  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
    }
  };

  /**
   * Handle disconnect button click
   */
  const handleDisconnect = () => {
    disconnect();
    setError(null);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <h1>SafeBite</h1>
          </Link>
        </div>

        {isConnected ? (
          <>
            <div className="nav-links">
              {/* Show all dashboards, highlight current role */}
              <Link
                to="/producer"
                className={`nav-link ${isActive('/producer') ? 'active' : ''} ${role === ROLES.PRODUCER ? 'current-role' : ''}`}
              >
                Producer
                {role === ROLES.PRODUCER && <span className="role-indicator">You</span>}
              </Link>

              <Link
                to="/distributor"
                className={`nav-link ${isActive('/distributor') ? 'active' : ''} ${role === ROLES.DISTRIBUTOR ? 'current-role' : ''}`}
              >
                Distributor
                {role === ROLES.DISTRIBUTOR && <span className="role-indicator">You</span>}
              </Link>

              <Link
                to="/retailer"
                className={`nav-link ${isActive('/retailer') ? 'active' : ''} ${role === ROLES.RETAILER ? 'current-role' : ''}`}
              >
                Retailer
                {role === ROLES.RETAILER && <span className="role-indicator">You</span>}
              </Link>

              <Link
                to="/regulator"
                className={`nav-link ${isActive('/regulator') ? 'active' : ''} ${role === ROLES.REGULATOR ? 'current-role' : ''}`}
              >
                Regulator
                {role === ROLES.REGULATOR && <span className="role-indicator">You</span>}
              </Link>

              <Link
                to="/consumer"
                className={`nav-link ${isActive('/consumer') ? 'active' : ''} ${role === ROLES.CONSUMER ? 'current-role' : ''}`}
              >
                Consumer
                {role === ROLES.CONSUMER && <span className="role-indicator">You</span>}
              </Link>

              <Link
                to="/roles"
                className={`nav-link ${isActive('/roles') ? 'active' : ''}`}
                title="Role Management"
              >
                Roles
              </Link>
            </div>

            <div className="nav-wallet">
              <div className="wallet-info-compact">
                {roleName && (
                  <span className="wallet-role-badge">{roleName}</span>
                )}
                <span className="wallet-address">{formatAddress(account)}</span>
                <button
                  className="btn-disconnect-small"
                  onClick={handleDisconnect}
                  title="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="nav-wallet">
            <button
              className="btn-connect-nav"
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="metamask-icon-small" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.806 2.382L13.553 8.9l1.647-3.882L21.806 2.382z" fill="#E2761B"/>
                    <path d="M2.194 2.382l8.14 3.636L10.447 8.9 2.194 2.382z" fill="#E4761B"/>
                    <path d="M18.706 16.588l-2.294 3.53 4.918 1.353 1.412-4.823-4.036-.06z" fill="#E4761B"/>
                    <path d="M1.06 16.588l1.412 4.823 4.918-1.353-2.294-3.53-3.036.06z" fill="#E4761B"/>
                    <path d="M7.176 10.118l-1.176 1.765 4.235.188-.147-4.588-2.912 2.635z" fill="#E4761B"/>
                    <path d="M16.824 10.118l-2.912-2.635-.118 4.588 4.235-.188-1.205-1.765z" fill="#E4761B"/>
                    <path d="M6.412 20.118l2.823-1.412-2.47-1.882-.353 3.294z" fill="#D7C1B3"/>
                    <path d="M14.765 18.706l2.823 1.412-.353-3.294-2.47 1.882z" fill="#D7C1B3"/>
                    <path d="M17.588 20.118l-2.823-1.412.235 1.882-.118.353-2.588 1.294 1.03.588h4.706l1.03-.588-2.588-1.294-.118-.353.235-1.882z" fill="#233447"/>
                    <path d="M6.412 20.118l2.588 1.294-1.03.588H3.264l1.03-.588-2.588-1.294.118-.353.235-1.882-.235 1.882.118.353z" fill="#CD6116"/>
                    <path d="M10.588 14.588l-2.118-.353 1.5-.706.618 1.059z" fill="#E4751F"/>
                    <path d="M13.412 14.588l.618-1.059 1.5.706-2.118.353z" fill="#E4751F"/>
                  </svg>
                  Connect Wallet
                </>
              )}
            </button>
            {error && (
              <div className="nav-error">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}


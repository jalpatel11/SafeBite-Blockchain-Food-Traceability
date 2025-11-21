/**
 * ConnectWallet Component
 * Button to connect MetaMask wallet
 * 
 * Provides wallet connection UI with:
 * - Connect button when not connected
 * - Connected account display when connected
 * - Connection error handling
 * - Loading states
 * - Network switching
 */

import { useState } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import { useRole } from '../../hooks/useRole';
import { formatAddress } from '../../utils/helpers';
import './ConnectWallet.css';

/**
 * ConnectWallet Component
 * 
 * Uses useWeb3 hook to get connection state, shows "Connect Wallet" button
 * when not connected, shows formatted address and role when connected,
 * handles click to connect/disconnect, shows loading state during connection,
 * and displays error messages if connection fails.
 */
export default function ConnectWallet() {
  const { account, isConnected, isLoading, connect, disconnect } = useWeb3();
  const { roleName } = useRole();
  const [error, setError] = useState(null);

  /**
   * Handle connect button click
   * Calls connect function and handles errors
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
   * Calls disconnect function
   */
  const handleDisconnect = () => {
    disconnect();
    setError(null);
  };

  return (
    <div className="connect-wallet">
      {!isConnected ? (
        <div className="wallet-not-connected">
          <button
            className="btn-connect"
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
                <svg className="metamask-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="wallet-error">
              <p>{error}</p>
              {error.includes('MetaMask is not installed') && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="install-link"
                >
                  Install MetaMask
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-info">
            <div className="account-info">
              <div className="account-address">
                <span className="address-label">Account:</span>
                <span className="address-value">{formatAddress(account)}</span>
              </div>
              {roleName && (
                <div className="role-badge">
                  <span className="role-label">Role:</span>
                  <span className="role-value">{roleName}</span>
                </div>
              )}
            </div>
            <button
              className="btn-disconnect"
              onClick={handleDisconnect}
              title="Disconnect wallet"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

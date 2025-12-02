/**
 * Role Management Dashboard
 * Simple GUI to assign roles to accounts
 */

import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { roleAPI } from '../services/api';
import { formatAddress } from '../utils/helpers';
import './RoleManagement.css';

const ROLES = [
  { value: 0, label: 'PRODUCER' },
  { value: 1, label: 'DISTRIBUTOR' },
  { value: 2, label: 'RETAILER' },
  { value: 3, label: 'REGULATOR' }
];

const TEST_ACCOUNTS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', label: 'Account 1 (PRODUCER)' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: 'Account 2 (DISTRIBUTOR)' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', label: 'Account 3 (RETAILER)' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', label: 'Account 4 (REGULATOR)' },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', label: 'Account 5 (CONSUMER)' }
];

export default function RoleManagement() {
  const { account, isConnected } = useWeb3();
  const [accountAddress, setAccountAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [checkedRole, setCheckedRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(false);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    
    if (!accountAddress || !accountAddress.trim()) {
      setMessage('Please enter an account address');
      setMessageType('error');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(accountAddress.trim())) {
      setMessage('Invalid Ethereum address format');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await roleAPI.grantRoleDev(accountAddress.trim(), selectedRole);
      
      if (response.data && response.data.success) {
        setMessage(`✅ ${response.data.roleName} role assigned successfully to ${formatAddress(accountAddress)}`);
        setMessageType('success');
        setAccountAddress('');
        if (checkedRole && checkedRole.address.toLowerCase() === accountAddress.trim().toLowerCase()) {
          checkRole(accountAddress.trim());
        }
      } else {
        setMessage(response.data?.message || 'Failed to assign role');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Failed to assign role');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRole = async (address) => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setCheckedRole(null);
      return;
    }

    setCheckingRole(true);
    try {
      const response = await roleAPI.check(address.trim());
      if (response.data && response.data.success) {
        setCheckedRole({
          address: address.trim(),
          role: response.data.role,
          roleName: response.data.roleName
        });
      } else {
        setCheckedRole(null);
      }
    } catch (error) {
      setCheckedRole(null);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setAccountAddress(address);
    if (address && /^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      checkRole(address);
    } else {
      setCheckedRole(null);
    }
  };

  const fillTestAccount = (address) => {
    setAccountAddress(address);
    checkRole(address);
  };

  return (
    <div className="role-management-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Role Management Dashboard</h1>
          <p className="dashboard-subtitle">
            Assign roles to accounts. Only the contract owner (deployer) can assign roles.
          </p>
        </div>
        {isConnected && account && (
          <div className="dashboard-info">
            <div className="info-item">
              <span className="info-label">Account:</span>
              <span className="info-value">{formatAddress(account)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        {message && (
          <div className={`dashboard-section message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="dashboard-section">
          <div className="role-form-card">
            <h2>Assign Role</h2>
            <form onSubmit={handleAssignRole}>
            <div className="form-group">
              <label htmlFor="accountAddress">Account Address</label>
              <input
                id="accountAddress"
                type="text"
                value={accountAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="address-input"
              />
              {checkedRole && (
                <div className="current-role-info">
                  <strong>Current Role:</strong> {checkedRole.roleName} (Role {checkedRole.role})
                </div>
              )}
              {checkingRole && (
                <div className="checking-role">Checking role...</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                className="role-select"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="form-hint">
                Note: CONSUMER role is public and doesn't need to be assigned.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !accountAddress.trim()}
              className="btn btn-primary"
            >
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </button>
            </form>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="test-accounts-card">
            <h2>Quick Test Accounts</h2>
            <p className="card-description">
              Click to fill address from test accounts:
            </p>
          <div className="test-accounts-grid">
            {TEST_ACCOUNTS.map((testAccount) => (
              <button
                key={testAccount.address}
                onClick={() => fillTestAccount(testAccount.address)}
                className="btn btn-primary test-account-btn"
                title={testAccount.address}
              >
                {testAccount.label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}


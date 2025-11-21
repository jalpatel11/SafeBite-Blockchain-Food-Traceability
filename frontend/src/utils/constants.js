/**
 * Constants
 * Application-wide constants
 */

// Role enum values (must match contract)
export const ROLES = {
  PRODUCER: 0,
  DISTRIBUTOR: 1,
  RETAILER: 2,
  REGULATOR: 3,
  CONSUMER: 4
};

// Role names
export const ROLE_NAMES = {
  [ROLES.PRODUCER]: 'Producer',
  [ROLES.DISTRIBUTOR]: 'Distributor',
  [ROLES.RETAILER]: 'Retailer',
  [ROLES.REGULATOR]: 'Regulator',
  [ROLES.CONSUMER]: 'Consumer'
};

// Product status enum values
export const PRODUCT_STATUS = {
  CREATED: 0,
  SHIPPED: 1,
  RECEIVED: 2,
  STORED: 3,
  DELIVERED: 4
};

// Product status names
export const STATUS_NAMES = {
  [PRODUCT_STATUS.CREATED]: 'Created',
  [PRODUCT_STATUS.SHIPPED]: 'Shipped',
  [PRODUCT_STATUS.RECEIVED]: 'Received',
  [PRODUCT_STATUS.STORED]: 'Stored',
  [PRODUCT_STATUS.DELIVERED]: 'Delivered'
};

// Verification type enum values (must match contract)
export const VERIFICATION_TYPES = {
  QUALITY_CHECK: 0,
  REGULATORY_APPROVAL: 1,
  AUTHENTICITY: 2,
  COMPLIANCE: 3
};

// Verification type names
export const VERIFICATION_TYPE_NAMES = {
  [VERIFICATION_TYPES.QUALITY_CHECK]: 'Quality Check',
  [VERIFICATION_TYPES.REGULATORY_APPROVAL]: 'Regulatory Approval',
  [VERIFICATION_TYPES.AUTHENTICITY]: 'Authenticity Verification',
  [VERIFICATION_TYPES.COMPLIANCE]: 'Compliance Check'
};

// Network configuration
export const NETWORK_CONFIG = {
  localhost: {
    chainId: 1337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545'
  }
};

// Test account addresses for transfer recipients (Hardhat local network)
// These are the pre-configured test accounts with assigned roles
export const TEST_ACCOUNTS = [
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: ROLES.DISTRIBUTOR,
    roleName: 'Distributor',
    label: 'Distributor (0x7099...79C8)'
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    role: ROLES.RETAILER,
    roleName: 'Retailer',
    label: 'Retailer (0x3C44...293BC)'
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    role: ROLES.CONSUMER,
    roleName: 'Consumer',
    label: 'Consumer (0x15d3...6A65)'
  }
];


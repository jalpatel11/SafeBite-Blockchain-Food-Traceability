# SafeBite: Blockchain-Based Food Traceability System

## Overview

SafeBite is an enterprise-grade blockchain solution for food supply chain traceability. The system provides end-to-end product tracking from production to consumption, ensuring transparency, authenticity, and regulatory compliance through immutable blockchain records.

## Key Features

- **Role-Based Access Control**: Five distinct roles (Producer, Distributor, Retailer, Regulator, Consumer) with granular permissions
- **Role Management Dashboard**: Web-based interface for assigning roles to accounts
- **Product Lifecycle Management**: Complete tracking from registration through delivery
- **Event-Based History Tracking**: Gas-efficient provenance records using blockchain events instead of storage arrays
- **Quality & Compliance Verification**: Automated certificate generation and authenticity verification
- **QR Code Integration**: Product identification and consumer verification via QR scanning
- **Real-Time Status Tracking**: Product status updates throughout the supply chain

## System Architecture

The system is built on a four-tier architecture:

### 1. Smart Contracts Layer
Solidity smart contracts deployed on Ethereum-compatible blockchain:
- **SafeBiteAccessRoles.sol**: Role-based access control and permission management
- **SafeBiteSupplyChain.sol**: Core business logic for product lifecycle, transfers, and verification
- **Event-Based Architecture**: History tracking via events for gas efficiency

### 2. Backend API Layer
Express.js REST API server providing:
- Smart contract interaction abstraction
- Business logic implementation
- QR code generation services
- Data formatting and validation

### 3. Frontend Application Layer
React.js web application featuring:
- Role-based dashboards
- Role management interface
- MetaMask wallet integration
- QR code scanning and generation
- Real-time product verification

### 4. Blockchain Network Layer
Ethereum-compatible network (Hardhat for local development, configurable for testnets/mainnet)

## Project Structure

```
SafeBite-Blockchain-Food-Traceability/
│
├── contracts/                    # Smart contract source code
│   ├── SafeBiteAccessRoles.sol   # Access control contract
│   └── SafeBiteSupplyChain.sol   # Supply chain contract
│
├── backend/                      # Express.js API server
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API route definitions
│   ├── services/                 # Business logic layer
│   ├── utils/                    # Utility functions
│   └── server.js                 # Application entry point
│
├── frontend/                     # React.js web application
│   └── src/
│       ├── components/           # Reusable UI components
│       ├── pages/                # Page-level components
│       ├── services/             # API and blockchain services
│       ├── hooks/                 # Custom React hooks
│       └── utils/                # Helper functions
│
├── scripts/                      # Deployment scripts
│   └── deploy-local.js           # Local network deployment
│
└── deployments/                  # Deployment artifacts
    └── local.json                # Contract addresses and ABIs
```

## Role Definitions

### PRODUCER
- **Responsibilities**: Product registration, initial metadata creation, QR code generation
- **Permissions**: Register products, view registered products, transfer to distributors
- **Use Cases**: Food manufacturers, farms, processing facilities

### DISTRIBUTOR
- **Responsibilities**: Product transportation, status updates, ownership transfers
- **Permissions**: Receive products, update shipment status, transfer to retailers/consumers
- **Use Cases**: Logistics companies, wholesale distributors

### RETAILER
- **Responsibilities**: Inventory management, quality assessments, consumer sales
- **Permissions**: Receive products, perform quality checks, transfer to consumers
- **Use Cases**: Grocery stores, retail chains, markets

### REGULATOR
- **Responsibilities**: Compliance auditing, quality verification, system oversight
- **Permissions**: View all products, perform compliance checks, perform quality checks
- **Use Cases**: Government agencies, food safety inspectors, certification bodies

### CONSUMER
- **Responsibilities**: Product verification, provenance review
- **Permissions**: Verify authenticity, view complete product history, scan QR codes
- **Use Cases**: End consumers, verification services

## Prerequisites

- **Node.js** v16 or higher
- **npm** v7 or higher (or yarn)
- **MetaMask** browser extension (for frontend interaction)
- **Git** (for version control)

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/jalpatel11/SafeBite-Blockchain-Food-Traceability.git
cd SafeBite-Blockchain-Food-Traceability
```


### 2. Install Dependencies

```bash
# Install root dependencies (Hardhat, deployment tools)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Start Local Blockchain
```bash
# From project root
npm run node
```

This starts a local Hardhat network on http://127.0.0.1:8545 with Chain ID 1337.

### 4. Deploy Smart Contracts

In a new terminal:
```bash
npm run deploy:local
```

Contract addresses are saved to deployments/local.json.

### 5. Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit .env with contract addresses from deployments/local.json:

env
```
RPC_URL=http://127.0.0.1:8545
ACCESS_CONTROL_CONTRACT_ADDRESS=<from deployments/local.json>
SUPPLY_CHAIN_CONTRACT_ADDRESS=<from deployments/local.json>
PORT=3000
```

Start backend server:

```bash
npm start
```

### 6. Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit .env:

env
```
VITE_API_URL=http://localhost:3000
VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=<from deployments/local.json>
VITE_SUPPLY_CHAIN_CONTRACT_ADDRESS=<from deployments/local.json>
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=1337
```

Start frontend development server:

```bash
npm run dev
```

### 7. Assign Roles

In a new terminal:

```bash
./assign-roles.sh
```

This assigns roles to the default Hardhat test accounts.

### 8. Configure MetaMask

1. Install MetaMask browser extension
2. Add custom network:
   - Network Name: Hardhat Local
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: ETH
3. Import test accounts from `ACCOUNTS_REFERENCE.md`
4. Connect wallet to the application

## Technology Stack

### Smart Contracts
- **Solidity** ^0.8.0
- **Hardhat** - Development environment
- **Ethers.js** - Blockchain interaction

### Backend
- **Express.js** - Web framework
- **Ethers.js** - Smart contract interaction
- **QRCode** - QR code generation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** ^18.0 - UI framework
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Ethers.js** - Blockchain interaction
- **Axios** - HTTP client
- **html5-qrcode** - QR code scanning

## Core Functionality

### Product Registration
Producers register products with metadata including name, batch ID, origin, and optional metadata hash. Each product receives a unique identifier.

### Ownership Transfers
Products can be transferred between stakeholders with automatic status updates and transfer history recording.

### Verification System
- **Quality Checks**: Retailers and regulators perform quality assessments
- **Compliance Checks**: Regulators verify regulatory compliance
- **Authenticity Verification**: Automatic verification when quality and compliance checks pass

### Provenance Tracking
Complete immutable history retrieved from blockchain events:
- Product registration events
- Ownership transfers
- Status updates
- Verification records

History is stored in event logs rather than contract storage arrays, significantly reducing gas costs while maintaining full traceability.

## API Documentation

See `backend/README.md` for complete API endpoint documentation.

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Contract tests (if implemented)
npm run test
```

### Building for Production

```bash
# Frontend production build
cd frontend
npm run build
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required configuration.

## Troubleshooting

### Backend Connection Issues
- Verify Hardhat node is running: `npm run node`
- Check RPC_URL in backend `.env`
- Ensure contracts are deployed: `npm run deploy:local`

### Frontend Connection Issues
- Verify backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Ensure MetaMask is connected to Hardhat Local network

### Role Assignment Issues
- Run `./assign-roles.sh` after deploying contracts
- Verify backend is running before assigning roles
- Check contract addresses match deployment

### MetaMask Issues
- Ensure Hardhat Local network is added (Chain ID: 1337)
- Verify test accounts are imported
- Check network connection in MetaMask

## Security Considerations

- Private keys should never be committed to version control
- Development endpoints (`/api/roles/grant-dev`) are for local testing only
- Production deployments require proper authentication and authorization
- Smart contracts should be audited before mainnet deployment

## License

Apache License 2.0

## Documentation

- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend application documentation
- `ACCOUNTS_REFERENCE.md` - Test account credentials
- `DEPLOYMENT_LOCAL.md` - Local deployment guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

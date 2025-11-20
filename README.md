# SafeBite: Blockchain-Based Food Supply Chain Verification System

## Description

SafeBite is a blockchain-based system designed to track food products from production to consumption. The system uses smart contracts deployed on the Ethereum blockchain to create an immutable record of each product's journey through the supply chain. This allows consumers and stakeholders to verify the origin, authenticity, and handling of food products at any point in the supply chain.

## Key Features

- **Role-Based Access Control**: The system manages five different roles (Producer, Distributor, Retailer, Regulator, and Consumer) with specific permissions for each role
- **Product Registration**: Producers can register new products with unique identifiers and metadata
- **Ownership Tracking**: Complete history of product ownership transfers is recorded on the blockchain
- **Status Management**: Products move through statuses: Created, Shipped, Received, Stored, and Delivered
- **Verification System**: Products can be verified for authenticity, quality, and regulatory compliance
- **Complete Provenance**: All product events and transactions are permanently stored and can be retrieved

## System Architecture

The system consists of four main components:

1. **Smart Contracts**: Solidity contracts that define the business logic and access control rules
   - `SafeBiteAccessRoles.sol`: Manages role assignments and permissions
   - `SafeBiteSupplyChain.sol`: Handles product lifecycle, transfers, and verification

2. **Backend API**: Express.js server that provides REST API endpoints for frontend interaction
   - Handles smart contract interactions using Ethers.js
   - Provides QR code generation services
   - Manages API routes for products, transfers, verification, and roles

3. **Frontend Application**: React.js web application with MetaMask integration
   - Role-based dashboards for each stakeholder type
   - QR code scanning and generation
   - Product verification and provenance viewing

4. **Blockchain Network**: Ethereum-compatible network (local Hardhat network for development)

## Dependencies

### Required Software

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **MetaMask** browser extension (for frontend testing)

### Development Tools

- **Hardhat**: Ethereum development environment for compiling and deploying contracts
- **Ethers.js**: JavaScript library for interacting with Ethereum blockchain
- **Express.js**: Web framework for backend API
- **React.js**: Frontend framework
- **Vite**: Build tool for frontend development

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/jalpatel11/SafeBite-Blockchain-Food-Traceability.git
cd SafeBite-Blockchain-Food-Traceability
```

### Step 2: Install Root Dependencies

```bash
npm install
```

This installs Hardhat and related development tools.

### Step 3: Compile Smart Contracts

```bash
npx hardhat compile
```

This compiles the Solidity contracts and generates artifacts.

### Step 4: Deploy Contracts Locally

Deploy contracts to a local Hardhat network:

```bash
npm run deploy:local
```

This deploys both contracts and saves the addresses to `deployments/local.json`.

### Step 5: Set Up Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

Edit the `.env` file with contract addresses from `deployments/local.json`:

```env
RPC_URL=http://127.0.0.1:8545
ACCESS_CONTROL_CONTRACT_ADDRESS=<from deployments/local.json>
SUPPLY_CHAIN_CONTRACT_ADDRESS=<from deployments/local.json>
PORT=3000
```

Start the backend server:

```bash
npm run dev
```

The server runs on `http://localhost:3000`.

### Step 6: Set Up Frontend

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit the `.env` file with contract addresses and API URL:

```env
VITE_API_URL=http://localhost:3000
VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=<from deployments/local.json>
VITE_SUPPLY_CHAIN_CONTRACT_ADDRESS=<from deployments/local.json>
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=1337
```

Start the frontend development server:

```bash
npm run dev
```

The application runs on `http://localhost:5173`.

## Project Structure

```
SafeBite-Blockchain-Food-Traceability/
├── contracts/              # Smart contract source code
│   ├── SafeBiteAccessRoles.sol
│   └── SafeBiteSupplyChain.sol
├── backend/                # Backend API server
│   ├── controllers/        # Request handlers
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic and contract interactions
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server entry point
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components (dashboards)
│   │   ├── services/       # API and contract services
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── package.json
├── scripts/                # Deployment scripts
│   ├── deploy.js           # General deployment script
│   └── deploy-local.js     # Local deployment script
├── deployments/            # Deployment addresses
│   └── local.json          # Local deployment information
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Root project dependencies
└── README.md               # This file
```

## Smart Contract Components

### SafeBiteAccessRoles.sol

This contract manages role-based access control for the system. It defines five roles and provides functions to grant, revoke, and check roles.

**Key Functions:**
- `grantRole(address, Role)`: Assigns a role to an address
- `revokeRole(address, Role)`: Removes a role from an address
- `hasRole(address, Role)`: Checks if an address has a specific role
- `getRole(address)`: Returns the role of an address

### SafeBiteSupplyChain.sol

This is the main contract that handles all product-related operations.

**Key Functions:**
- `registerProduct()`: Registers a new product (Producer only)
- `transferOwnership()`: Transfers product ownership between stakeholders
- `updateStatus()`: Updates product status
- `verifyAuthenticity()`: Verifies product authenticity
- `performQualityCheck()`: Records quality assessments
- `checkCompliance()`: Performs regulatory compliance checks
- `getProductJourney()`: Returns product journey timeline
- `getCompleteProvenance()`: Returns complete product history

## Development Status

- **Smart Contracts**: Fully implemented and tested
- **Backend API**: Structure created with routes, controllers, and services. Implementation in progress.
- **Frontend Application**: Structure created with components, pages, and services. Implementation in progress.
- **Testing**: Test suite to be developed
- **Documentation**: Basic documentation complete

## Usage

### For Producers

Producers can register new products through the frontend interface or by calling the smart contract directly. Each registered product receives a unique ID and can be tracked through the supply chain.

### For Distributors

Distributors receive products from producers and can transfer ownership to retailers or consumers. The system automatically updates product status when transfers occur.

### For Retailers

Retailers can receive products, perform quality checks, update product status, and transfer products to consumers.

### For Regulators

Regulators have access to view all products and can perform compliance checks. They can audit the complete supply chain history for any product.

### For Consumers

Consumers can verify product authenticity by scanning QR codes or entering product IDs. They can view the complete product journey and provenance information.

## License

Apache License 2.0

## Contact

For questions or contributions, please open an issue on the GitHub repository.

# SafeBite: Blockchain-Based Food Traceability System

## Project Description

SafeBite is a blockchain-based food supply chain traceability system that enables end-to-end tracking of food products from production to consumption. The system uses Ethereum-compatible smart contracts to create an immutable record of product movements, quality checks, and compliance verifications throughout the supply chain.

The project demonstrates how blockchain technology can enhance transparency and trust in multi-party supply chains by providing a decentralized, tamper-proof record of product provenance. All stakeholders—producers, distributors, retailers, regulators, and consumers—can access and verify product information through a web-based interface.

**Key Objectives:**
- Track products through the entire supply chain lifecycle
- Ensure product authenticity through quality and compliance verification
- Provide transparent, immutable records accessible to all stakeholders
- Enable consumer verification through QR code scanning
- Demonstrate gas-efficient blockchain architecture using event-based history tracking

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

## Dependencies

### Required Software

- **Node.js** v16 or higher - JavaScript runtime environment
- **npm** v7 or higher - Package manager (comes with Node.js)
- **MetaMask** browser extension - Web3 wallet for blockchain interactions
- **Git** - Version control system

### System Requirements

- Operating System: macOS, Linux, or Windows
- RAM: Minimum 4GB (8GB recommended)
- Disk Space: ~500MB for dependencies
- Browser: Chrome, Firefox, Edge, or Safari (with MetaMask extension)

## Setup Instructions

### Step 1: Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/jalpatel11/SafeBite-Blockchain-Food-Traceability.git
cd SafeBite-Blockchain-Food-Traceability
```

### Step 2: Install Dependencies

Install dependencies for all three components of the system:

```bash
# Install root dependencies (Hardhat and deployment tools)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

**Note:** This process may take a few minutes as it downloads all required packages.

### Step 3: Start Local Blockchain Network

Open a new terminal window and start the Hardhat local blockchain:

```bash
# From project root directory
npm run node
```

**Expected Output:** You should see "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"

This creates a local Ethereum-compatible blockchain network running on port 8545 with Chain ID 1337. Keep this terminal open.

### Step 4: Deploy Smart Contracts

Open a second terminal window and deploy the smart contracts:

```bash
# From project root directory
npm run deploy:local
```

**Expected Output:** You should see contract addresses printed. These are saved to `deployments/local.json`.

**Important:** Note the contract addresses displayed, as you'll need them for configuration.

### Step 5: Configure Backend Environment

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit the `.env` file and add the contract addresses from `deployments/local.json`:

```env
RPC_URL=http://127.0.0.1:8545
ACCESS_CONTROL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SUPPLY_CHAIN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PORT=3000
```

**Note:** Replace the addresses above with the actual addresses from your deployment.

4. Start the backend server:
```bash
npm start
```

**Expected Output:** "SafeBite Backend API running on port 3000"

Keep this terminal open.

### Step 6: Configure Frontend Environment

1. Open a third terminal window and navigate to the frontend directory:
```bash
cd frontend
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit the `.env` file with the same contract addresses:

```env
VITE_API_URL=http://localhost:3000
VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_SUPPLY_CHAIN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=1337
```

**Note:** Replace the addresses with your actual deployment addresses.

4. Start the frontend development server:
```bash
npm run dev
```

**Expected Output:** "Local: http://localhost:5173/"

The application will automatically open in your browser, or navigate to http://localhost:5173

### Step 7: Assign Roles to Test Accounts

Open a fourth terminal window and run the role assignment script:

```bash
# From project root directory
./assign-roles.sh
```

**Expected Output:** You should see confirmation messages for each role assignment.

This assigns roles to the default Hardhat test accounts:
- Account 1: PRODUCER
- Account 2: DISTRIBUTOR
- Account 3: RETAILER
- Account 4: REGULATOR

### Step 8: Configure MetaMask Wallet

1. **Install MetaMask Extension**
   - Install MetaMask from https://metamask.io
   - Create or import a wallet

2. **Add Hardhat Local Network**
   - Click the network dropdown in MetaMask
   - Select "Add Network" → "Add a network manually"
   - Enter the following:
     - **Network Name:** Hardhat Local
     - **RPC URL:** http://127.0.0.1:8545
     - **Chain ID:** 1337
     - **Currency Symbol:** ETH
   - Click "Save"

3. **Import Test Accounts**
   - Click the account icon → "Import Account"
   - Select "Private Key"
   - Import accounts from `ACCOUNTS_REFERENCE.md` (private keys are provided for testing)
   - Switch between accounts to test different roles

4. **Connect to Application**
   - Open http://localhost:5173 in your browser
   - Click "Connect Wallet" in the navigation bar
   - Approve the connection in MetaMask

## How to Use the System

### Accessing the Application

Once all services are running, open your browser and navigate to:
```
http://localhost:5173
```

### Using the System

1. **Connect Wallet**
   - Click "Connect Wallet" in the navigation bar
   - Approve the connection in MetaMask
   - Ensure you're connected to "Hardhat Local" network

2. **Producer Workflow**
   - Switch to Producer account in MetaMask
   - Navigate to Producer Dashboard
   - Register a new product with name, batch ID, and origin
   - View registered products and generate QR codes
   - Transfer products to distributors

3. **Distributor Workflow**
   - Switch to Distributor account
   - View received products in Distributor Dashboard
   - Transfer products to retailers or consumers
   - Update shipment status

4. **Retailer Workflow**
   - Switch to Retailer account
   - View inventory in Retailer Dashboard
   - Perform quality checks on products (score 0-100)
   - Transfer products to consumers

5. **Regulator Workflow**
   - Switch to Regulator account
   - View all products in the system (system-wide access)
   - Perform compliance checks on products
   - Perform quality checks on products
   - Products are automatically verified as authentic when both checks pass

6. **Consumer Workflow**
   - Navigate to Consumer Dashboard
   - Scan QR code or enter product ID manually
   - View complete product provenance
   - Verify product authenticity
   - Review transfer history and verification records

### Key Features Demonstration

- **Product Registration:** Producers can register products with unique identifiers
- **Ownership Transfers:** Products can be transferred between stakeholders with automatic status updates
- **Quality Verification:** Retailers and regulators can perform quality assessments
- **Compliance Verification:** Regulators can verify regulatory compliance
- **QR Code Scanning:** Consumers can scan QR codes to verify product authenticity
- **Complete Provenance:** All stakeholders can view complete, immutable product history

## Deployment

### Local Development Deployment

The system is configured for local development using Hardhat network. All services run on localhost:

- **Blockchain Node:** http://127.0.0.1:8545
- **Backend API:** http://localhost:3000
- **Frontend Application:** http://localhost:5173

### Production Deployment Considerations

For production deployment, the following changes would be required:

1. **Blockchain Network:** Deploy to a public testnet (Sepolia) or mainnet
2. **Environment Variables:** Update RPC URLs and contract addresses
3. **Security:** Implement proper authentication and authorization
4. **Infrastructure:** Deploy backend and frontend to cloud services
5. **Monitoring:** Set up logging and monitoring systems

See `hardhat.config.js` for network configuration options.

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

## Security Considerations

- Private keys should never be committed to version control
- Development endpoints (`/api/roles/grant-dev`) are for local testing only
- Production deployments require proper authentication and authorization
- Smart contracts should be audited before mainnet deployment

## Testing

### Running Backend Tests

```bash
cd backend
npm test
```

### Running Contract Tests

```bash
npm test
```

## Troubleshooting

### Common Issues and Solutions

**Issue: Backend cannot connect to blockchain**
- Solution: Ensure Hardhat node is running (`npm run node`)
- Verify RPC_URL in backend `.env` matches `http://127.0.0.1:8545`

**Issue: Frontend cannot connect to backend**
- Solution: Verify backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env` is `http://localhost:3000`

**Issue: MetaMask connection fails**
- Solution: Ensure Hardhat Local network is added (Chain ID: 1337)
- Verify test accounts are imported
- Check network is selected in MetaMask

**Issue: Role assignment fails**
- Solution: Run `./assign-roles.sh` after deploying contracts
- Ensure backend is running before assigning roles
- Verify contract addresses match deployment

**Issue: Transactions fail**
- Solution: Check MetaMask is on correct network (Hardhat Local)
- Verify account has ETH (Hardhat provides unlimited test ETH)
- Check browser console for error messages

## Source Code

The complete source code is available in this repository. The project is organized into three main components:

### Smart Contracts (`/contracts`)
- **SafeBiteAccessRoles.sol** - Role-based access control contract that manages five distinct stakeholder roles
- **SafeBiteSupplyChain.sol** - Main supply chain contract handling product lifecycle, transfers, and verification

### Backend API (`/backend`)
- Express.js REST API server providing abstraction layer between frontend and blockchain
- Smart contract interaction service using Ethers.js
- QR code generation service
- Event querying for gas-efficient history retrieval
- Controllers and routes for products, transfers, verification, and roles

### Frontend Application (`/frontend`)
- React.js single-page application with role-based dashboards
- MetaMask wallet integration for blockchain transactions
- QR code scanning and generation functionality
- Component-based architecture with reusable UI elements

### Key Implementation Details

**Event-Based History Tracking:**
The system uses blockchain events instead of storage arrays to track product history. This approach reduces gas costs by approximately 95% while maintaining complete traceability. History is retrieved by querying event logs using Ethers.js `queryFilter()` method.

**Role-Based Access Control:**
Access control is managed through a separate smart contract (`SafeBiteAccessRoles.sol`) that defines five distinct roles with different permissions. Roles are enforced using Solidity modifiers.

**Automatic Authenticity Verification:**
Products are automatically verified as authentic when both quality and compliance checks pass. This logic is implemented in the smart contract and works regardless of the order in which checks are performed.

### Directory Structure

The complete source code is organized as follows:

```
SafeBite-Blockchain-Food-Traceability/
│
├── contracts/                    # Smart contract source code (Solidity)
│   ├── SafeBiteAccessRoles.sol   # Role-based access control contract
│   └── SafeBiteSupplyChain.sol  # Main supply chain business logic
│
├── backend/                      # Express.js REST API server
│   ├── controllers/              # HTTP request handlers
│   │   ├── productController.js
│   │   ├── transferController.js
│   │   ├── verificationController.js
│   │   └── roleController.js
│   ├── routes/                   # API endpoint definitions
│   │   ├── products.js
│   │   ├── transfers.js
│   │   ├── verification.js
│   │   ├── roles.js
│   │   └── qr.js
│   ├── services/                 # Business logic and contract interactions
│   │   ├── contractService.js    # Smart contract interaction layer
│   │   └── qrService.js          # QR code generation
│   ├── utils/                    # Utility functions
│   │   ├── helpers.js            # Helper functions
│   │   └── errors.js             # Error handling
│   ├── server.js                 # Express server entry point
│   └── package.json              # Backend dependencies
│
├── frontend/                     # React.js web application
│   └── src/
│       ├── components/           # Reusable UI components
│       │   ├── Common/           # Navigation, QR display
│       │   ├── Products/         # Product cards, lists, registration
│       │   ├── Verification/     # QR scanner, quality/compliance checks
│       │   └── Wallet/           # Wallet connection UI
│       ├── pages/                # Page-level components
│       │   ├── Home.jsx
│       │   ├── ProducerDashboard.jsx
│       │   ├── DistributorDashboard.jsx
│       │   ├── RetailerDashboard.jsx
│       │   ├── RegulatorDashboard.jsx
│       │   ├── ConsumerDashboard.jsx
│       │   ├── ProductVerification.jsx
│       │   ├── TransferProduct.jsx
│       │   └── RoleManagement.jsx
│       ├── services/             # External service integrations
│       │   ├── api.js            # Backend API client
│       │   ├── web3.js           # MetaMask integration
│       │   └── contracts.js      # Smart contract interactions
│       ├── hooks/                # Custom React hooks
│       │   ├── useWeb3.js        # Web3 connection state
│       │   └── useRole.js        # User role management
│       ├── utils/                # Helper functions
│       │   ├── constants.js      # Application constants
│       │   └── helpers.js        # Utility functions
│       ├── App.jsx               # Main application component
│       ├── main.jsx              # Application entry point
│       └── index.css             # Global styles
│
├── scripts/                      # Deployment and utility scripts
│   ├── deploy-local.js           # Local network deployment script
│   └── assign-roles.sh           # Role assignment script
│
├── deployments/                  # Deployment artifacts
│   └── local.json                # Contract addresses and deployment info
│
├── artifacts/                    # Compiled contract artifacts
│   └── contracts/                # ABI and bytecode
│
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Root dependencies
├── README.md                     # This file
├── ACCOUNTS_REFERENCE.md         # Test account credentials
└── assign-roles.sh               # Role assignment script
```

### Code Organization

**Smart Contracts:**
- Written in Solidity ^0.8.0
- Follows best practices for security and gas optimization
- Uses modifiers for access control
- Implements event-based history tracking

**Backend:**
- Layered architecture (Routes → Controllers → Services)
- RESTful API design
- Comprehensive error handling
- Event querying for history retrieval

**Frontend:**
- Component-based React architecture
- Custom hooks for state management
- Service layer for API and blockchain interactions
- Responsive design with consistent theming

For detailed code documentation, see:
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend application documentation

## License

Apache License 2.0

## Repository

**GitHub Repository:** https://github.com/jalpatel11/SafeBite-Blockchain-Food-Traceability

All source code is available in this public repository. The repository includes:
- Complete smart contract source code
- Backend API implementation
- Frontend web application
- Deployment scripts
- Documentation and setup guides

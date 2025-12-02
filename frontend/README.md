# SafeBite Frontend Application

## Overview

The SafeBite frontend is a React.js single-page application that provides role-based interfaces for all stakeholders in the food supply chain. It integrates with MetaMask for blockchain transactions and communicates with the backend API for data operations.

## Architecture

The application follows a component-based architecture with clear separation of concerns:

- *Components*: Reusable UI elements
- *Pages*: Full-page components for different views
- *Services*: External communication (API, blockchain)
- *Hooks*: Custom React hooks for state management
- *Utils*: Shared utility functions

## Project Structure
```
frontend/
│
├── src/
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Wallet/              # Wallet connection components
│   │   │   └── ConnectWallet.jsx
│   │   ├── Products/            # Product-related components
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductList.jsx
│   │   │   └── ProductRegistration.jsx
│   │   ├── Verification/        # Verification components
│   │   │   ├── QRScanner.jsx
│   │   │   ├── QualityCheck.jsx
│   │   │   └── ComplianceCheck.jsx
│   │   └── Common/              # Shared components
│   │       ├── Navigation.jsx
│   │       └── QRCodeDisplay.jsx
│   │
│   ├── pages/                    # Page-level components
│   │   ├── Home.jsx
│   │   ├── ProducerDashboard.jsx
│   │   ├── DistributorDashboard.jsx
│   │   ├── RetailerDashboard.jsx
│   │   ├── RegulatorDashboard.jsx
│   │   ├── ConsumerDashboard.jsx
│   │   ├── ProductVerification.jsx
│   │   ├── TransferProduct.jsx
│   │   └── RoleManagement.jsx
│   │
│   ├── services/                 # External service integrations
│   │   ├── api.js               # Backend API client
│   │   ├── web3.js              # MetaMask integration
│   │   └── contracts.js         # Smart contract interactions
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useWeb3.js           # Web3 connection state
│   │   └── useRole.js           # User role management
│   │
│   ├── utils/                    # Utility functions
│   │   ├── constants.js         # Application constants
│   │   └── helpers.js           # Helper functions
│   │
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles and theme
│
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies
```

## Setup

### Installation


bash
```
npm install
```
### Environment Configuration

Copy the example environment file:

bash
```
cp .env.example .env
```
Configure environment variables (Vite requires VITE_ prefix):

env
```
VITE_API_URL=http://localhost:3000
VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=0x...
VITE_SUPPLY_CHAIN_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=1337
```
Contract addresses are available in ```../deployments/local.json``` after deployment.

### Development Server
bash
```
npm run dev
```
Application runs on ```http://localhost:5173``` with hot module replacement.

### Production Build

bash
```
npm run build
```
Generates optimized production build in dist/ directory.

## Application Flow

### Authentication Flow

1. User connects MetaMask wallet
2. Application detects connected account
3. Backend API checks account role
4. Application routes to appropriate dashboard
5. Role-based features are enabled/disabled

### Product Registration Flow

1. Producer navigates to Producer Dashboard
2. Fills product registration form
3. Submits transaction via MetaMask
4. Transaction confirmed on blockchain
5. Product appears in product list
6. QR code generated and displayed

### Product Verification Flow

1. Consumer scans QR code or enters product ID
2. Application fetches product data from backend
3. Backend queries blockchain for product information
4. Verification history and provenance displayed
5. Authenticity status shown with verification details

## Component Architecture

### Pages

Each role has a dedicated dashboard page:

- *Home*: Landing page with role-based navigation
- *ProducerDashboard*: Product registration and management
- *DistributorDashboard*: Product transfers and shipment tracking
- *RetailerDashboard*: Inventory management and quality checks
- *RegulatorDashboard*: Compliance auditing and oversight
- *ConsumerDashboard*: Product verification and provenance viewing
- *RoleManagement*: Role assignment interface for administrators

### Components

Reusable components organized by functionality:

- *Wallet Components*: MetaMask connection and wallet status
- *Product Components*: Product display, listing, and registration
- *Verification Components*: QR scanning, quality checks, compliance checks
- *Common Components*: Navigation, QR code display

### Services

- *api.js*: HTTP client for backend API communication
- *web3.js*: MetaMask wallet connection and transaction signing
- *contracts.js*: Direct smart contract interactions (if needed)

### Hooks

- *useWeb3*: Manages wallet connection state and account information
- *useRole*: Fetches and manages user role from backend

## Styling

The application uses a modern, food-safety themed design:

- CSS variables for consistent theming
- Component-scoped stylesheets
- Responsive design for mobile and desktop
- Modern UI with smooth transitions and animations

## Key Features

### Role-Based Access Control

- Automatic role detection on wallet connection
- Role-specific dashboard routing
- Feature visibility based on user role
- Permission-based action buttons

### QR Code Integration

- QR code generation for products
- Camera-based QR code scanning
- QR code data parsing and validation
- Direct navigation to product verification

### Real-Time Updates

- Automatic refresh on account change
- Transaction status tracking
- Real-time product status updates
- Verification history updates

## Dependencies

- *react*: UI library (^18.0)
- *react-dom*: React DOM rendering
- *react-router-dom*: Client-side routing
- *ethers*: Ethereum JavaScript library
- *axios*: HTTP client for API requests
- *html5-qrcode*: QR code scanning library
- *vite*: Build tool and development server

## Development

### Component Development

1. Create component file in appropriate directory
2. Add corresponding CSS file
3. Import and use in parent component
4. Add to routing if it's a page component

### Adding New Features

1. Define API endpoints in services/api.js
2. Create UI components
3. Integrate with existing pages
4. Add routing if needed
5. Update navigation if required

### State Management

- Use React hooks for local state
- useWeb3 and useRole for global wallet/role state
- API calls for data fetching
- Context API for shared state (if needed)

## Common Issues

### MetaMask Not Detected
- Install MetaMask browser extension
- Refresh the page
- Check browser console for errors

### Network Mismatch
- Ensure Hardhat Local network is added to MetaMask
- Verify Chain ID is 1337
- Switch network in MetaMask if needed

### Backend Connection Failed
- Verify backend server is running
- Check VITE_API_URL in .env
- Review browser console for CORS errors

### Role Not Detected
- Run ./assign-roles.sh to assign roles
- Refresh page after connecting wallet
- Verify account address has assigned role

### Transaction Rejected
- Check MetaMask is unlocked
- Verify sufficient balance (test ETH)
- Review transaction details in MetaMask
- Check browser console for error messages

## Production Deployment

### Build Configuration

1. Update environment variables for production
2. Build application: npm run build
3. Deploy dist/ directory to hosting service
4. Configure environment variables on hosting platform

### Considerations

- Use production API endpoints
- Configure CORS properly
- Use HTTPS for secure connections
- Set up error tracking and monitoring
- Optimize bundle size
- Implement code splitting if needed

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- MetaMask extension required

## Performance

- Code splitting for route-based chunks
- Lazy loading for heavy components
- Optimized asset loading
- Efficient re-rendering with React hooks

## Security

- Never expose private keys in frontend code
- Validate all user inputs
- Sanitize data before display
- Use HTTPS in production
- Implement proper CORS policies
- Validate contract addresses from environment

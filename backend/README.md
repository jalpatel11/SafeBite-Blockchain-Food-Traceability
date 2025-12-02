# SafeBite Backend API

## Overview

The SafeBite backend is an Express.js REST API server that provides an abstraction layer between the frontend application and blockchain smart contracts. It handles smart contract interactions, business logic, data validation, and additional services such as QR code generation.

## Architecture

The backend follows a layered architecture pattern:

- **Routes**: Define API endpoints and HTTP methods
- **Controllers**: Handle HTTP requests, validate input, orchestrate business logic
- **Services**: Implement business logic and smart contract interactions
- **Utils**: Provide shared utilities for error handling and data processing

### Event-Based History Retrieval

The backend queries blockchain events to retrieve product history instead of reading from contract storage arrays. This approach significantly reduces gas costs:
- Transfer history: Queries `OwnershipTransferred` events
- Verification history: Queries `ProductVerified`, `AuthenticityConfirmed`, and `ComplianceChecked` events
- Product journey: Queries `ProductRegistered`, `OwnershipTransferred`, and `StatusUpdated` events

## Project Structure

```
backend/
│
├── server.js                    # Express server configuration and startup
│
├── routes/                      # API route definitions
│   ├── products.js              # Product management endpoints
│   ├── transfers.js             # Ownership transfer endpoints
│   ├── verification.js         # Verification endpoints
│   ├── roles.js                 # Role management endpoints
│   └── qr.js                    # QR code generation endpoints
│
├── controllers/                 # Request handlers
│   ├── productController.js     # Product operation handlers
│   ├── transferController.js    # Transfer operation handlers
│   ├── verificationController.js # Verification handlers
│   └── roleController.js       # Role management handlers
│
├── services/                    # Business logic layer
│   ├── contractService.js       # Smart contract interaction service
│   └── qrService.js            # QR code generation service
│
├── utils/                       # Utility modules
│   ├── errors.js               # Error handling utilities
│   └── helpers.js              # Common helper functions
│
└── tests/                       # Test suite
    └── backend.test.js          # API endpoint tests
```

## Setup

### Installation

```bash
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
RPC_URL=http://127.0.0.1:8545
ACCESS_CONTROL_CONTRACT_ADDRESS=0x...
SUPPLY_CHAIN_CONTRACT_ADDRESS=0x...
PORT=3000
```

Contract addresses are available in `../deployments/local.json` after deployment.

### Running the Server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server runs on `http://localhost:3000` by default.

## Request Flow

1. **Client Request**: Frontend sends HTTP request to API endpoint
2. **Route Handler**: Route file matches request to controller function
3. **Controller**: Validates input, calls appropriate service
4. **Service**: Executes business logic, interacts with smart contracts
5. **Response**: Controller formats and returns response to client

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/register` | Register a new product |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/:id/journey` | Get product journey timeline |
| GET | `/api/products/:id/provenance` | Get complete product provenance |
| GET | `/api/products` | List products with optional filters |

### Transfers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transfers` | Transfer product ownership |
| POST | `/api/transfers/batch` | Batch transfer multiple products |
| GET | `/api/transfers/:productId` | Get transfer history for a product |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/authenticity` | Verify product authenticity |
| POST | `/api/verification/quality` | Perform quality check |
| POST | `/api/verification/compliance` | Perform compliance check |
| GET | `/api/verification/:productId` | Get verification history |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles/check/:address` | Check role of an address |
| POST | `/api/roles/grant-dev` | Grant role (development only) |
| POST | `/api/roles/batch-grant-dev` | Batch grant roles (development only) |

### QR Codes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qr/:productId` | Get QR code image |
| GET | `/api/qr/:productId/data` | Get QR code data as JSON |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

## Core Services

### contractService.js

Manages all smart contract interactions:

- Initializes contract instances with provider and signer
- Provides methods for all contract operations
- Handles transaction signing and confirmation
- Formats contract responses for API consumption
- Manages certificate generation and metadata merging
- Queries blockchain events for history retrieval (transfers, verifications, journey)

### qrService.js

Handles QR code generation:

- Generates QR code images for products
- Creates QR code data payloads
- Supports multiple QR code formats

## Error Handling

The backend implements standardized error handling:

- Contract errors are parsed for user-friendly messages
- HTTP status codes follow REST conventions
- Error responses include descriptive messages
- Validation errors are returned with field-level details

## Dependencies

- **express**: Web application framework
- **ethers**: Ethereum JavaScript library (v6)
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management
- **qrcode**: QR code image generation
- **nodemon**: Development auto-reload (dev dependency)
- **jest**: Testing framework (dev dependency)
- **supertest**: HTTP assertion library (dev dependency)

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- API endpoint functionality
- Request validation
- Error handling
- Contract interaction mocking

## Development Guidelines

### Adding New Endpoints

1. Define route in appropriate route file
2. Create controller function
3. Implement service method if needed
4. Add error handling
5. Write tests

### Contract Interaction

All contract interactions should go through `contractService.js`:

```javascript
const contractService = require('./services/contractService');

// Example: Register a product
const result = await contractService.registerProduct(
  name, batchId, origin, metadataHash
);
```

### Error Handling

Use the error utilities:

```javascript
const { formatError } = require('./utils/errors');

try {
  // operation
} catch (error) {
  return res.status(500).json(formatError(error, 'operationName'));
}
```

## Common Issues

### Cannot Connect to Blockchain
- Verify Hardhat node is running: `npm run node`
- Check `RPC_URL` in `.env` matches Hardhat network
- Ensure network is accessible

### Contract Address Not Found
- Deploy contracts: `npm run deploy:local`
- Verify addresses in `deployments/local.json`
- Update `.env` with correct addresses

### Port Already in Use
- Check if another process is using port 3000
- Change `PORT` in `.env` to an available port
- Update frontend `VITE_API_URL` accordingly

### Transaction Failures
- Verify account has sufficient balance (test ETH)
- Check role assignments are correct
- Ensure contract addresses are valid
- Review contract revert messages in error logs

## Production Considerations

- Use environment-specific configuration
- Implement proper authentication and authorization
- Add rate limiting for API endpoints
- Set up monitoring and logging
- Use secure RPC endpoints
- Implement request validation middleware
- Add API documentation (Swagger/OpenAPI)

## Security Notes

- Development endpoints (`grant-dev`, `batch-grant-dev`) should be disabled in production
- Private keys should never be stored in code or environment variables
- Implement proper CORS policies for production
- Use HTTPS in production environments
- Validate and sanitize all user inputs

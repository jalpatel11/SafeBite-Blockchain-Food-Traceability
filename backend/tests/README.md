# Backend Tests

This directory contains test files for the SafeBite backend API.

## Prerequisites

Before running tests, make sure you have:

1. Installed all dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file:
```env
RPC_URL=http://127.0.0.1:8545
ACCESS_CONTROL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SUPPLY_CHAIN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PORT=3000
```

3. Deployed contracts to local Hardhat network (if testing contract interactions):
```bash
# From project root
npm run deploy:local
```

## Running Tests

### Run All Tests

```bash
npm test
```

This runs all test files in the `tests/` directory.

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This runs tests in watch mode, automatically re-running tests when files change.

### Run a Specific Test File

```bash
npm test -- backend.test.js
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

This generates a coverage report showing which code is tested.

## Test Structure

The test file `backend.test.js` includes tests for:

- Health check endpoint
- Product API endpoints
- Transfer API endpoints
- Verification API endpoints
- Role API endpoints
- QR Code API endpoints
- Service layer functions
- Utility functions
- Error handling

## Test Configuration

Tests are configured using `jest.config.js` in the backend root directory. The configuration:

- Uses Node.js test environment
- Looks for test files in `tests/` directory
- Generates coverage reports
- Runs in verbose mode for detailed output

## Notes

- Tests require the backend server to be properly configured
- Some tests may fail if contract services are not fully implemented
- Make sure the local Hardhat network is running if testing contract interactions
- Test data uses local Hardhat test accounts and addresses


// Main backend server file
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const contractService = require('./services/contractService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafeBite API is running' });
});

// API Routes
const productRoutes = require('./routes/products');
const transferRoutes = require('./routes/transfers');
const verificationRoutes = require('./routes/verification');
const roleRoutes = require('./routes/roles');
const qrRoutes = require('./routes/qr');

app.use('/api/products', productRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/qr', qrRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize contract service (for both tests and normal startup)
// Initialize asynchronously - tests can wait for it or initialize themselves
let contractServiceInitialized = false;
const initPromise = contractService.initialize().then(() => {
  contractServiceInitialized = true;
}).catch((error) => {
  // Don't fail on import - let tests handle initialization
  if (require.main === module) {
    console.error('Failed to initialize contract service:', error.message);
    console.error('Please ensure contracts are deployed and RPC_URL is correct');
    process.exit(1);
  }
});

// Initialize contract service and start server
async function startServer() {
  try {
    // Wait for contract service initialization
    await initPromise;
    
    // Start server
    return new Promise((resolve) => {
      const server = app.listen(PORT, () => {
  console.log(`SafeBite Backend API running on port ${PORT}`);
        resolve(server);
});
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server only if this file is run directly (not when imported for tests)
if (require.main === module) {
  startServer();
}

// Export initialization promise for tests
module.exports.initPromise = initPromise;

module.exports = app;

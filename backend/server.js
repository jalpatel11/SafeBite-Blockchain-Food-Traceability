// backend/server.js
// SafeBite Backend API Server

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// ---- Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---------- API Routes ----------
const productRoutes = require('./routes/products');
const roleRoutes = require('./routes/roles');
const transferRoutes = require('./routes/transfers');
const qrRoutes = require('./routes/qr');
const verificationRoutes = require('./routes/verification');

app.use('/api/products', productRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/verification', verificationRoutes);

// Add the missing GET route for your curl:
// GET /api/verify/product/:productId
// If your controller exposes verifyProduct, use it; else, wrap verifyAuthenticity to behave like a GET.
if (typeof verificationController.verifyProduct === 'function') {
  app.get('/api/verify/product/:productId', verificationController.verifyProduct);
} else {
  app.get('/api/verify/product/:productId', (req, res) => {
    // Minimal wrapper: call authenticity with a dummy signer (not used in mock)
    const body = {
      signerAddress: '0x0000000000000000000000000000000000000000',
      productId: Number(req.params.productId),
      notes: 'GET verify'
    };
    // Reuse the same controller function
    verificationController.verifyAuthenticity({ ...req, body }, res);
  });
}

// ---------- Error handler (keep last)
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  res.status(status).json({ error: true, code: status, message });
});

// ---------- Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SafeBite Backend API running on port ${PORT}`);
});

module.exports = app;
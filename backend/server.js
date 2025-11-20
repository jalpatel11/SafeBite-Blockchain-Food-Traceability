// backend/server.js
// SafeBite Backend API Server (ready to paste)

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

// ---- Try to mount routes from files if they exist; otherwise, fall back to inline routers.
function tryRequire(path) {
  try { return require(path); } catch { return null; }
}

// ---------- PRODUCTS ----------
let productRoutes = tryRequire('./routes/products');
if (!productRoutes) {
  const router = express.Router();
  const controller = require('./controllers/productController');

  // Your skeleton uses :id param
  router.post('/register', controller.registerProduct);
  router.get('/:id', controller.getProduct);
  router.get('/:id/journey', controller.getProductJourney);
  router.get('/:id/provenance', controller.getProductProvenance);
  router.get('/', controller.listProducts);

  productRoutes = router;
}
app.use('/api/products', productRoutes);

// ---------- ROLES ----------
let roleRoutes = tryRequire('./routes/roles');
if (!roleRoutes) {
  const router = express.Router();
  const controller = require('./controllers/roleController');

  router.get('/check/:address', controller.checkRole);
  router.get('/my-role', controller.getMyRole);
  router.post('/grant', controller.grantRole);

  roleRoutes = router;
}
app.use('/api/roles', roleRoutes);

// ---------- TRANSFERS ----------
let transferRoutes = tryRequire('./routes/transfers');
if (!transferRoutes) {
  const router = express.Router();
  const controller = require('./controllers/transferController');

  router.post('/', controller.transferOwnership);
  router.post('/batch', controller.batchTransferOwnership);
  router.get('/:productId', controller.getTransferHistory);

  transferRoutes = router;
}
app.use('/api/transfers', transferRoutes);

// ---------- QR ----------
let qrRoutes = tryRequire('./routes/qr');
if (!qrRoutes) {
  const router = express.Router();
  const qrService = require('./services/qrService');
  const { isValidProductId } = require('./utils/helpers');

  // GET /api/qr/:productId -> PNG
  router.get('/:productId', async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const baseUrl = req.query.baseUrl || process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      if (!isValidProductId(productId)) return res.status(400).json({ error: true, message: 'Invalid productId' });
      const buf = await qrService.generateQRCodeBuffer(productId, baseUrl);
      res.setHeader('Content-Type', 'image/png');
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: e.message || 'QR generation failed' });
    }
  });

  // GET /api/qr/:productId/data -> JSON
  router.get('/:productId/data', async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const baseUrl = req.query.baseUrl || process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      if (!isValidProductId(productId)) return res.status(400).json({ error: true, message: 'Invalid productId' });
      const data = qrService.getQRCodeData(productId, baseUrl);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ error: e.message || 'QR data generation failed' });
    }
  });

  qrRoutes = router;
}
app.use('/api/qr', qrRoutes);

// ---------- VERIFICATION ----------
let verificationRoutes = tryRequire('./routes/verification');
const verificationController = require('./controllers/verificationController');

if (verificationRoutes) {
  app.use('/api/verification', verificationRoutes);
} else {
  const router = express.Router();

  // POST /api/verification/authenticity
  router.post('/authenticity', verificationController.verifyAuthenticity);

  // POST /api/verification/quality
  router.post('/quality', verificationController.performQualityCheck);

  // POST /api/verification/compliance
  router.post('/compliance', verificationController.checkCompliance);

  // GET /api/verification/:productId
  router.get('/:productId', verificationController.getVerificationHistory);

  app.use('/api/verification', router);
}

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
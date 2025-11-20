/**
 * Product Controller
 * Handles product-related operations
 */

const contractService = require('../services/contractService');
const qrService = require('../services/qrService');
const { formatError } = require('../utils/errors');
const { isValidProductId } = require('../utils/helpers');

/**
 * Register a new product
 * POST /api/products/register
 * Body: { signerAddress, name, batchId, origin, metadataHash }
 */
async function registerProduct(req, res) {
  try {
    const { signerAddress, name, batchId, origin, metadataHash = '' } = req.body || {};

    // Validate inputs
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (!name) missing.push('name');
    if (!batchId) missing.push('batchId');
    if (!origin) missing.push('origin');
    if (missing.length) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'registerProduct',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }

    // Create product on chain (or mock store)
    const result = await contractService.registerProduct(
      signerAddress, name, batchId, origin, metadataHash
    );
    const productId = Number(result.productId);
    const transactionHash = result.txHash || null; // mock mode may not return tx hash

    // Generate QR for the new product
    const qr = await qrService.generateQRCode(productId);

    return res.json({
      success: true,
      productId,
      transactionHash,
      qrCode: qr.qr,
      verifyUrl: qr.verifyUrl
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'registerProduct'));
  }
}

/**
 * Get product information
 * GET /api/products/:id
 */
async function getProduct(req, res) {
  try {
    const rawId = req.params.id;
    if (!isValidProductId(rawId)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'getProduct',
        message: 'Invalid productId'
      });
    }
    const productId = Number(rawId);

    const product = await contractService.getProduct(productId);

    // optional extras (best-effort; not all ABIs provide these)
    let authentic = null;
    try { authentic = await contractService.isProductAuthentic(productId); } catch (_) {}

    return res.json({
      success: true,
      product: {
        ...product,
        authentic
      }
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getProduct'));
  }
}

/**
 * Get product journey
 * GET /api/products/:id/journey
 */
async function getProductJourney(req, res) {
  try {
    const rawId = req.params.id;
    if (!isValidProductId(rawId)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'getProductJourney',
        message: 'Invalid productId'
      });
    }
    const productId = Number(rawId);

    const journey = await contractService.getProductJourney(productId);
    return res.json({ success: true, journey });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getProductJourney'));
  }
}

/**
 * Get complete product provenance
 * GET /api/products/:id/provenance
 */
async function getProductProvenance(req, res) {
  try {
    const rawId = req.params.id;
    if (!isValidProductId(rawId)) {
      return res.status(400).json({
        error: true,
        code: 400,
        context: 'getProductProvenance',
        message: 'Invalid productId'
      });
    }
    const productId = Number(rawId);

    // contractService returns JSON string in our implementation
    const provenanceJson = await contractService.getCompleteProvenance(productId);
    let provenance;
    try { provenance = JSON.parse(provenanceJson); }
    catch { provenance = provenanceJson; } // if ABI returns array directly

    return res.json({ success: true, provenance });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getProductProvenance'));
  }
}

/**
 * List products (optionally filter by owner)
 * GET /api/products?owner=0x...&role=...
 */
async function listProducts(req, res) {
  try {
    const { owner } = req.query;

    // Get list (mock: quick; on-chain: reads products)
    const all = await contractService.listProducts();

    // If owner filter requested, enrich each item to check current owner
    let products = all;
    if (owner) {
      const target = String(owner).toLowerCase();
      const detailed = await Promise.all(
        all.map(async (p) => {
          try { return await contractService.getProduct(Number(p.productId)); }
          catch { return null; }
        })
      );
      products = detailed
        .filter(Boolean)
        .filter(p => (p.owner || '').toLowerCase() === target)
        .map(p => ({ productId: p.productId, name: p.name, batchId: p.batchId, origin: p.origin, owner: p.owner }));
    }

    return res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'listProducts'));
  }
}

module.exports = {
  registerProduct,
  getProduct,
  getProductJourney,
  getProductProvenance,
  listProducts
};
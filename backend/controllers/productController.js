/**
 * Product Controller
 * Handles product-related operations
 */

const contractService = require('../services/contractService');
const qrService = require('../services/qrService');
const { formatError, parseContractError } = require('../utils/errors');
const { isValidProductId, isValidAddress } = require('../utils/helpers');

/**
 * Register a new product
 * POST /api/products/register
 * 
 * Body: { signerAddress, name, batchId, origin, metadataHash }
 * 
 * Validates input (name, batchId, origin required), calls contractService.registerProduct(),
 * generates QR code for the product, and returns product ID, transaction hash, and QR code.
 */
async function registerProduct(req, res) {
  try {
    const { signerAddress, name, batchId, origin, metadataHash = '' } = req.body;
    
    // Validate inputs
    if (!signerAddress || !isValidAddress(signerAddress)) {
      return res.status(400).json(formatError(new Error('Invalid signer address'), 'registerProduct'));
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json(formatError(new Error('Product name is required'), 'registerProduct'));
    }
    if (!batchId || batchId.trim().length === 0) {
      return res.status(400).json(formatError(new Error('Batch ID is required'), 'registerProduct'));
    }
    if (!origin || origin.trim().length === 0) {
      return res.status(400).json(formatError(new Error('Origin is required'), 'registerProduct'));
    }
    
    // Call contractService.registerProduct()
    const result = await contractService.registerProduct(signerAddress, name, batchId, origin, metadataHash);
    
    // Generate QR code
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrCode = await qrService.generateQRCode(result.productId, baseUrl);
    
    // Return response
    res.json({
      success: true,
      productId: result.productId,
      transactionHash: result.transactionHash,
      qrCode: qrCode
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'registerProduct'));
  }
}

/**
 * Get product information
 * GET /api/products/:id
 * 
 * Validates product ID, calls contractService.getProduct() which already includes
 * owner, status, and authentic status, and returns formatted product data.
 */
async function getProduct(req, res) {
  try {
    const productId = parseInt(req.params.id);
    
    // Validate productId
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'getProduct'));
    }
    
    // Call contractService.getProduct() (already includes owner, status, authentic)
    const product = await contractService.getProduct(productId);
    
    // Return formatted product
    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'getProduct'));
  }
}

/**
 * Get product journey
 * GET /api/products/:id/journey
 * 
 * Validates product ID, calls contractService.getProductJourney(), and returns journey array.
 */
async function getProductJourney(req, res) {
  try {
    const productId = parseInt(req.params.id);
    
    // Validate productId
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'getProductJourney'));
    }
    
    // Call contractService.getProductJourney()
    const journey = await contractService.getProductJourney(productId);
    
    // Return journey
    res.json({
      success: true,
      journey: journey
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'getProductJourney'));
  }
}

/**
 * Get complete product provenance
 * GET /api/products/:id/provenance
 * 
 * Validates product ID, calls contractService.getCompleteProvenance(),
 * parses JSON string, and returns provenance object.
 */
async function getProductProvenance(req, res) {
  try {
    const productId = parseInt(req.params.id);
    
    // Validate productId
    if (!isValidProductId(productId)) {
      return res.status(400).json(formatError(new Error('Invalid product ID'), 'getProductProvenance'));
    }
    
    // Call contractService.getCompleteProvenance()
    const provenanceString = await contractService.getCompleteProvenance(productId);
    
    // Parse JSON string
    const provenance = JSON.parse(provenanceString);
    
    // Return provenance
    res.json({
      success: true,
      provenance: provenance
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'getProductProvenance'));
  }
}

/**
 * List products (filtered by role/ownership/producer)
 * GET /api/products?owner=address&producer=address
 * 
 * Gets optional query params (owner, producer), gets product count,
 * fetches products and filters by owner or producer, and returns product list.
 * 
 * - If `producer` is specified: returns all products registered by that producer (regardless of current ownership)
 * - If `owner` is specified: returns all products currently owned by that address
 * - If neither is specified: returns all products
 */
async function listProducts(req, res) {
  try {
    const { owner, producer } = req.query;
    
    // Get product count
    const count = await contractService.getProductCount();
    
    const products = [];
    
    // If producer specified, filter by producer (who registered the product)
    if (producer && isValidAddress(producer)) {
      for (let i = 1; i <= count; i++) {
        try {
          const product = await contractService.getProduct(i);
          if (product.producer && product.producer.toLowerCase() === producer.toLowerCase()) {
            products.push(product);
          }
        } catch (error) {
          // Product might not exist, skip it
          continue;
        }
      }
    }
    // If owner specified, filter by current owner
    else if (owner && isValidAddress(owner)) {
      for (let i = 1; i <= count; i++) {
        try {
          const product = await contractService.getProduct(i);
          if (product.currentOwner && product.currentOwner.toLowerCase() === owner.toLowerCase()) {
            products.push(product);
          }
        } catch (error) {
          // Product might not exist, skip it
          continue;
        }
      }
    } else {
      // Fetch all products
      for (let i = 1; i <= count; i++) {
        try {
          const product = await contractService.getProduct(i);
          products.push(product);
        } catch (error) {
          // Product might not exist, skip it
          continue;
        }
      }
    }
    
    // Return list of products
    res.json({
      success: true,
      products: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json(formatError(error, 'listProducts'));
  }
}

module.exports = {
  registerProduct,
  getProduct,
  getProductJourney,
  getProductProvenance,
  listProducts
};


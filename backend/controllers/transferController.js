/**
 * Transfer Controller
 * Handles product ownership transfer operations
 */

const contractService = require('../services/contractService');
const { formatError } = require('../utils/errors');
const { isValidAddress, isValidProductId } = require('../utils/helpers');

/**
 * Transfer product ownership
 * POST /api/transfers
 * Body: { signerAddress, productId, toAddress, shipmentDetails }
 */
async function transferOwnership(req, res) {
  try {
    const { signerAddress, productId, toAddress, shipmentDetails = '' } = req.body || {};

    // Validate inputs
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (productId === undefined || productId === null) missing.push('productId');
    if (!toAddress) missing.push('toAddress');
    if (missing.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'transferOwnership',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }
    if (!isValidAddress(signerAddress) || !isValidAddress(toAddress)) {
      return res.status(400).json({
        error: true, code: 400, context: 'transferOwnership',
        message: 'Invalid Ethereum address format'
      });
    }
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'transferOwnership',
        message: 'Invalid productId'
      });
    }

    // Execute transfer (mock: returns { ok:true } ; on-chain: { txHash })
    const tx = await contractService.transferOwnership(
      signerAddress,
      Number(productId),
      toAddress,
      shipmentDetails
    );

    return res.json({
      success: true,
      transactionHash: tx?.txHash || null,
      message: 'Ownership transferred successfully'
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'transferOwnership'));
  }
}

/**
 * Batch transfer multiple products
 * POST /api/transfers/batch
 * Body: { signerAddress, productIds: number[], toAddress, shipmentDetails }
 */
async function batchTransferOwnership(req, res) {
  try {
    const { signerAddress, productIds, toAddress, shipmentDetails = '' } = req.body || {};

    // Validate inputs
    const missing = [];
    if (!signerAddress) missing.push('signerAddress');
    if (!Array.isArray(productIds)) missing.push('productIds');
    if (!toAddress) missing.push('toAddress');
    if (missing.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'batchTransferOwnership',
        message: `Missing fields: ${missing.join(', ')}`
      });
    }
    if (!isValidAddress(signerAddress) || !isValidAddress(toAddress)) {
      return res.status(400).json({
        error: true, code: 400, context: 'batchTransferOwnership',
        message: 'Invalid Ethereum address format'
      });
    }
    const invalidIds = productIds.filter((id) => !isValidProductId(id));
    if (invalidIds.length) {
      return res.status(400).json({
        error: true, code: 400, context: 'batchTransferOwnership',
        message: `Invalid productIds: ${invalidIds.join(', ')}`
      });
    }

    const tx = await contractService.batchTransferOwnership(
      signerAddress,
      productIds.map(Number),
      toAddress,
      shipmentDetails
    );

    return res.json({
      success: true,
      transactionHash: tx?.txHash || null,
      message: `Transferred ${productIds.length} products successfully`
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'batchTransferOwnership'));
  }
}

/**
 * Get transfer history for a product
 * GET /api/transfers/:productId
 */
async function getTransferHistory(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        error: true, code: 400, context: 'getTransferHistory',
        message: 'Invalid productId'
      });
    }

    const transfers = await contractService.getTransferHistory(Number(productId));

    // Normalize/format records
    const formatted = (transfers || []).map((t) => ({
      id: Number(t.id ?? 0),
      productId: Number(t.productId ?? productId),
      from: t.from || null,
      to: t.to || null,
      status: t.status || null,
      createdAt: Number(t.createdAt ?? 0),
      acceptedAt: Number(t.acceptedAt ?? 0)
    }));

    return res.json({ success: true, transfers: formatted });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json(formatError(error, 'getTransferHistory'));
  }
}

module.exports = {
  transferOwnership,
  batchTransferOwnership,
  getTransferHistory
};
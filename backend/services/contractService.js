/**
 * Contract Service
 * Handles interactions with SafeBite smart contracts using Ethers.js,
 * with a mock JSON store fallback for local dev.
 */

const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// helpers & error utils
const {
  loadContractAddresses,
  loadContractABI,
  isValidProductId
} = require('../utils/helpers');
const { httpError } = require('../utils/errors');

// local mock store (used when CHAIN_MODE=mock)
const store = require('./storeService');

// ---- config ----
const MODE = (process.env.CHAIN_MODE || 'mock').toLowerCase();

class ContractService {
  constructor() {
    this.mode = MODE;      // 'mock' | 'onchain'
    this.ready = false;

    // on-chain fields:
    this.provider = null;
    this.wallet = null;
    this.supplyChain = null;
    this.accessRoles = null;
  }

  // ---------- bootstrap ----------
  async initialize() {
    if (this.ready) return;

    if (this.mode === 'mock') {
      this.ready = true;
      return;
    }

    // on-chain
    const {
      RPC_URL,
      PRIVATE_KEY,
      CHAIN_ID
    } = process.env;

    if (!RPC_URL || !PRIVATE_KEY || !CHAIN_ID) {
      throw new Error(
        'Missing env: RPC_URL, PRIVATE_KEY, CHAIN_ID are required for CHAIN_MODE=onchain'
      );
    }

    // 1) provider + wallet
    this.provider = new ethers.JsonRpcProvider(RPC_URL, Number(CHAIN_ID));
    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);

    // 2) addresses
    const { accessControl, supplyChain } = loadContractAddresses();

    // 3) ABIs
    const scAbi = loadContractABI('SafeBiteSupplyChain');
    const arAbi = loadContractABI('SafeBiteAccessRoles');

    // 4) contracts
    this.supplyChain = new ethers.Contract(supplyChain, scAbi, this.wallet);
    this.accessRoles  = new ethers.Contract(accessControl, arAbi, this.wallet);

    this.ready = true;
  }

  // ---------- roles ----------
  async getUserRole(address) {
    if (this.mode === 'mock') {
      const role = await store.getRole(address);
      return role ?? null;
    }
    await this.initialize();
    if (!this.accessRoles.getRole) {
      throw httpError(501, 'getRole() not available on current AccessRoles ABI');
    }
    return await this.accessRoles.getRole(address);
  }

  async hasRole(address, role) {
    if (this.mode === 'mock') {
      const r = await store.getRole(address);
      return r === role;
    }
    await this.initialize();
    if (this.accessRoles.hasRole) {
      return await this.accessRoles.hasRole(address, role);
    }
    // fallback: compare getRole() to target role
    const r = await this.getUserRole(address);
    return r === role || String(r) === String(role);
  }

  async assignRole(address, role) {
    if (this.mode === 'mock') return store.assignRole({ address, role });
    await this.initialize();
    if (!this.accessRoles.assignRole) {
      throw httpError(501, 'assignRole() not available on current AccessRoles ABI');
    }
    const tx = await this.accessRoles.assignRole(address, role);
    await tx.wait();
    return { ok: true, txHash: tx.hash };
  }

  async revokeRole(address) {
    if (this.mode === 'mock') return store.revokeRole({ address });
    await this.initialize();
    if (!this.accessRoles.revokeRole) {
      throw httpError(501, 'revokeRole() not available on current AccessRoles ABI');
    }
    const tx = await this.accessRoles.revokeRole(address);
    await tx.wait();
    return { ok: true, txHash: tx.hash };
  }

  async getRole(address) {
    return this.getUserRole(address);
  }

  // ---------- products ----------
  async registerProduct(signerAddress, name, batchId, origin, metadataHash) {
    if (this.mode === 'mock') {
      return store.registerProduct({ signerAddress, name, batchId, origin, metadataHash });
    }
    await this.initialize();
    if (!this.supplyChain.registerProduct) {
      throw httpError(501, 'registerProduct() not available on current SupplyChain ABI');
    }
    const tx = await this.supplyChain.registerProduct(name, batchId, origin, metadataHash);
    const receipt = await tx.wait();

    // get latest product id (common pattern)
    let productId = 0;
    if (this.supplyChain.productCount) {
      const count = await this.supplyChain.productCount();
      productId = Number(count) - 1;
    } else if (this.supplyChain.getProductCount) {
      const count = await this.supplyChain.getProductCount();
      productId = Number(count) - 1;
    }

    return { txHash: receipt.hash, productId };
  }

  async updateProductMetadata(signerAddress, productId, metadataHash) {
    if (this.mode === 'mock') {
      return store.updateProductMetadata({ signerAddress, productId, metadataHash });
    }
    await this.initialize();
    if (!this.supplyChain.updateProductMetadata) {
      throw httpError(501, 'updateProductMetadata() not available on current SupplyChain ABI');
    }
    const tx = await this.supplyChain.updateProductMetadata(productId, metadataHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async getProduct(productId) {
    if (!isValidProductId(productId)) throw httpError(400, 'Invalid productId');
    if (this.mode === 'mock') return store.getProduct(productId);

    await this.initialize();
    if (!this.supplyChain.getProduct) {
      throw httpError(501, 'getProduct() not available on current SupplyChain ABI');
    }
    const p = await this.supplyChain.getProduct(productId);
    // Try to normalize common tuple shapes
    const obj = {
      productId: Number(productId),
      name: p.name ?? p[0],
      batchId: p.batchId ?? p[1],
      origin: p.origin ?? p[2],
      metadataHash: p.metadataHash ?? p[3],
      owner: p.owner ?? p[4],
      createdAt: Number(p.createdAt ?? p[5] ?? 0),
    };
    return obj;
  }

  async listProducts() {
    if (this.mode === 'mock') return store.listProducts();
    await this.initialize();
    if (!this.supplyChain.listProducts) {
      // fallback via count (slower)
      const results = [];
      const countFn = this.supplyChain.productCount || this.supplyChain.getProductCount;
      if (!countFn) throw httpError(501, 'No listProducts/productCount on ABI');
      const n = Number(await countFn());
      for (let id = 0; id < n; id++) {
        try {
          const p = await this.getProduct(id);
          results.push({ productId: id, name: p.name, batchId: p.batchId, origin: p.origin });
        } catch (_) { /* skip holes */ }
      }
      return results;
    }
    const ids = await this.supplyChain.listProducts();
    const out = [];
    for (const id of ids) {
      const p = await this.getProduct(Number(id));
      out.push({ productId: p.productId, name: p.name, batchId: p.batchId, origin: p.origin });
    }
    return out;
  }

  async getProductJourney(productId) {
    if (!isValidProductId(productId)) throw httpError(400, 'Invalid productId');
    if (this.mode === 'mock') return store.getProductJourney(productId);

    await this.initialize();
    if (!this.supplyChain.getProductJourney) {
      throw httpError(501, 'getProductJourney() not available on current SupplyChain ABI');
    }
    const arr = await this.supplyChain.getProductJourney(productId);
    return arr.map((j) => ({
      at: Number(j.at ?? j[0] ?? 0),
      action: j.action ?? j[1] ?? '',
      by: j.by ?? j[2] ?? ethers.ZeroAddress,
      meta: j.meta ?? j[3] ?? ''
    }));
  }

  async getProductProvenance(productId) {
    if (!isValidProductId(productId)) throw httpError(400, 'Invalid productId');
    if (this.mode === 'mock') return store.getProductProvenance(productId);

    await this.initialize();
    if (!this.supplyChain.getProductProvenance) {
      throw httpError(501, 'getProductProvenance() not available on current SupplyChain ABI');
    }
    const arr = await this.supplyChain.getProductProvenance(productId);
    return arr.map((r) => ({
      at: Number(r.at ?? r[0] ?? 0),
      location: r.location ?? r[1] ?? '',
      actor: r.actor ?? r[2] ?? ethers.ZeroAddress
    }));
  }

  // ---------- transfers ----------
  async initiateTransfer(productId, from, to) {
    if (this.mode === 'mock') return store.initiateTransfer({ productId, from, to });

    await this.initialize();
    if (this.supplyChain.initiateTransfer) {
      const tx = await this.supplyChain.initiateTransfer(productId, to);
      const receipt = await tx.wait();
      let transferId = 0;
      if (this.supplyChain.transferCount) {
        transferId = Number((await this.supplyChain.transferCount())) - 1;
      }
      return { transferId, txHash: receipt.hash };
    }

    // alternative name on some ABIs
    if (this.supplyChain.transferOwnership) {
      const tx = await this.supplyChain.transferOwnership(productId, to, '');
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }

    throw httpError(501, 'No initiateTransfer/transferOwnership on current ABI');
  }

  async acceptTransfer(transferId) {
    if (this.mode === 'mock') return store.acceptTransfer({ transferId, by: 'mock' });

    await this.initialize();
    if (!this.supplyChain.acceptTransfer) {
      throw httpError(501, 'acceptTransfer() not available on current ABI');
    }
    const tx = await this.supplyChain.acceptTransfer(transferId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash };
  }

  async getTransferHistory(productId) {
    if (this.mode === 'mock') return store.getTransferHistory(productId);

    await this.initialize();
    if (!this.supplyChain.getTransferHistory) {
      throw httpError(501, 'getTransferHistory() not available on current ABI');
    }
    const arr = await this.supplyChain.getTransferHistory(productId);
    return arr.map((t) => ({
      id: Number(t.id ?? t[0] ?? 0),
      productId: Number(t.productId ?? t[1] ?? 0),
      from: t.from ?? t[2] ?? ethers.ZeroAddress,
      to: t.to ?? t[3] ?? ethers.ZeroAddress,
      status: t.status ?? t[4] ?? '',
      createdAt: Number(t.createdAt ?? t[5] ?? 0),
      acceptedAt: Number(t.acceptedAt ?? t[6] ?? 0),
    }));
  }

  // ---------- extra functions from your skeleton (best-effort) ----------

  async getCompleteProvenance(productId) {
    const prov = await this.getProductProvenance(productId);
    return JSON.stringify(prov);
  }

  async transferOwnership(signerAddress, productId, toAddress, shipmentDetails = '') {
    // try the generic path implemented in initiateTransfer
    return this.initiateTransfer(productId, signerAddress, toAddress, shipmentDetails);
  }

  async batchTransferOwnership(signerAddress, productIds, toAddress, shipmentDetails = '') {
    if (this.mode === 'mock') {
      // simple loop in mock
      for (const pid of productIds) {
        await store.initiateTransfer({ productId: pid, from: signerAddress, to: toAddress });
      }
      return { ok: true };
    }
    await this.initialize();
    if (this.supplyChain.batchTransferOwnership) {
      const tx = await this.supplyChain.batchTransferOwnership(productIds, toAddress, shipmentDetails);
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }
    throw httpError(501, 'batchTransferOwnership() not available on current ABI');
  }

  async updateStatus(signerAddress, productId, newStatus) {
    if (this.mode === 'mock') {
      // log to journey for visibility
      const p = await store.getProduct(productId);
      p.journey.push({ at: Date.now(), action: 'UPDATE_STATUS', by: signerAddress, meta: { newStatus } });
      // Note: storeService handles file persistence
      return { ok: true };
    }
    await this.initialize();
    if (!this.supplyChain.updateStatus) throw httpError(501, 'updateStatus() not available on current ABI');
    const tx = await this.supplyChain.updateStatus(productId, newStatus);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async verifyAuthenticity(signerAddress, productId, notes = '') {
    if (this.mode === 'mock') {
      const p = await store.getProduct(productId); // throws 404 if missing
      return { txHash: `mock-${Date.now()}`, isValid: !!p.metadataHash };
    }
    await this.initialize();
    if (!this.supplyChain.verifyAuthenticity) throw httpError(501, 'verifyAuthenticity() not available on current ABI');
    const tx = await this.supplyChain.verifyAuthenticity(productId, notes);
    const receipt = await tx.wait();
    // some ABIs return via event; assume call then read side-effect:
    if (this.supplyChain.isProductAuthentic) {
      const isValid = await this.supplyChain.isProductAuthentic(productId);
      return { txHash: receipt.hash, isValid: !!isValid };
    }
    return { txHash: receipt.hash, isValid: true };
  }

  async performQualityCheck(signerAddress, productId, qualityScore, notes = '') {
    if (this.mode === 'mock') {
      const p = await store.getProduct(productId);
      p.journey.push({ at: Date.now(), action: 'QUALITY_CHECK', by: signerAddress, meta: { qualityScore, notes } });
      return { ok: true };
    }
    await this.initialize();
    if (!this.supplyChain.performQualityCheck) throw httpError(501, 'performQualityCheck() not available on current ABI');
    const tx = await this.supplyChain.performQualityCheck(productId, qualityScore, notes);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async checkCompliance(signerAddress, productId, compliant, certificateHash = '') {
    if (this.mode === 'mock') {
      const p = await store.getProduct(productId);
      p.journey.push({ at: Date.now(), action: 'COMPLIANCE_CHECK', by: signerAddress, meta: { compliant, certificateHash } });
      return { ok: true };
    }
    await this.initialize();
    if (!this.supplyChain.checkCompliance) throw httpError(501, 'checkCompliance() not available on current ABI');
    const tx = await this.supplyChain.checkCompliance(productId, compliant, certificateHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async getVerificationHistory(productId) {
    if (this.mode === 'mock') {
      const p = await store.getProduct(productId);
      return (p.journey || []).filter(j => j.action === 'QUALITY_CHECK');
    }
    await this.initialize();
    if (!this.supplyChain.getVerificationHistory) throw httpError(501, 'getVerificationHistory() not available on current ABI');
    const arr = await this.supplyChain.getVerificationHistory(productId);
    return arr;
  }

  async isProductAuthentic(productId) {
    if (this.mode === 'mock') {
      const p = await store.getProduct(productId);
      return !!p.metadataHash;
    }
    await this.initialize();
    if (!this.supplyChain.isProductAuthentic) throw httpError(501, 'isProductAuthentic() not available on current ABI');
    return await this.supplyChain.isProductAuthentic(productId);
  }

  async getProductCount() {
    if (this.mode === 'mock') {
      const list = await store.listProducts();
      return list.length;
    }
    await this.initialize();
    if (this.supplyChain.productCount) return Number(await this.supplyChain.productCount());
    if (this.supplyChain.getProductCount) return Number(await this.supplyChain.getProductCount());
    throw httpError(501, 'No productCount/getProductCount on current ABI');
  }

  async grantRole(signerAddress, accountAddress, role) {
    // alias for assignRole
    return this.assignRole(accountAddress, role);
  }
}

module.exports = new ContractService();
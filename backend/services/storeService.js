const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'safebite_store.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { products: [], transfers: [], roles: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
  registerProduct: async ({ signerAddress, name, batchId, origin, metadataHash }) => {
    const db = readDB();
    const productId = db.products.length;
    const now = Date.now();
    db.products.push({
      productId,
      name, batchId, origin, metadataHash,
      owner: signerAddress,
      createdAt: now,
      journey: [{ at: now, action: 'REGISTER', by: signerAddress, meta: { name, batchId, origin, metadataHash } }],
      provenance: [{ at: now, location: origin, actor: signerAddress }]
    });
    writeDB(db);
    return { productId };
  },

  updateProductMetadata: async ({ signerAddress, productId, metadataHash }) => {
    const db = readDB();
    const p = db.products[productId];
    if (!p) throw new Error('Product not found');
    p.metadataHash = metadataHash;
    p.journey.push({ at: Date.now(), action: 'UPDATE_METADATA', by: signerAddress, meta: { metadataHash } });
    writeDB(db);
    return { txHash: `mock-${Date.now()}` };
  },

  getProduct: async (productId) => {
    const db = readDB();
    const p = db.products[productId];
    if (!p) throw new Error('Product not found');
    return p;
  },

  getProductJourney: async (productId) => {
    const db = readDB();
    const p = db.products[productId];
    if (!p) throw new Error('Product not found');
    return p.journey || [];
  },

  getProductProvenance: async (productId) => {
    const db = readDB();
    const p = db.products[productId];
    if (!p) throw new Error('Product not found');
    return p.provenance || [];
  },

  listProducts: async () => {
    const db = readDB();
    return db.products.map(p => ({ productId: p.productId, name: p.name, batchId: p.batchId, origin: p.origin }));
  },

  initiateTransfer: async ({ productId, from, to }) => {
    const db = readDB();
    const p = db.products[productId];
    if (!p) throw new Error('Product not found');
    db.transfers.push({ id: db.transfers.length, productId, from, to, status: 'PENDING', createdAt: Date.now() });
    writeDB(db);
    return { transferId: db.transfers.length - 1 };
  },

  acceptTransfer: async ({ transferId, by }) => {
    const db = readDB();
    const t = db.transfers[transferId];
    if (!t) throw new Error('Transfer not found');
    if (t.status !== 'PENDING') throw new Error('Transfer not pending');
    t.status = 'ACCEPTED';
    t.acceptedAt = Date.now();
    const p = db.products[t.productId];
    if (p) {
      p.owner = by;
      p.journey.push({ at: Date.now(), action: 'TRANSFER', by, meta: { from: t.from, to: t.to } });
    }
    writeDB(db);
    return { ok: true };
  },

  getTransferHistory: async (productId) => {
    const db = readDB();
    return db.transfers.filter(t => t.productId === Number(productId));
  },

  assignRole: async ({ address, role }) => {
    const db = readDB();
    db.roles[address.toLowerCase()] = role;
    writeDB(db);
    return { ok: true };
  },

  revokeRole: async ({ address }) => {
    const db = readDB();
    delete db.roles[address.toLowerCase()];
    writeDB(db);
    return { ok: true };
  },

  getRole: async (address) => {
    const db = readDB();
    return db.roles[address.toLowerCase()] || null;
  }
};
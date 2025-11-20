/**
 * Backend API Tests
 * Tests for SafeBite backend API endpoints and services
 */

const request = require('supertest');
const app = require('../server');
const contractService = require('../services/contractService');
const qrService = require('../services/qrService');
const { isValidAddress, isValidProductId } = require('../utils/helpers');

// Test configuration
const TEST_PRODUCT_ID = 1;
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const INVALID_ADDRESS = '0x123';
const INVALID_PRODUCT_ID = -1;

describe('Backend API Tests', () => {
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Product API', () => {
    it('should register a new product', async () => {
      const productData = {
        signerAddress: TEST_ADDRESS,
        name: 'Test Product',
        batchId: 'BATCH001',
        origin: 'Test Origin',
        metadataHash: 'QmTestHash123'
      };

      const response = await request(app)
        .post('/api/products/register')
        .send(productData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('should reject registration with missing fields', async () => {
      const productData = {
        signerAddress: TEST_ADDRESS,
        name: 'Test Product'
        // Missing batchId and origin
      };

      const response = await request(app)
        .post('/api/products/register')
        .send(productData);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${TEST_PRODUCT_ID}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
    });

    it('should return error for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999');
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should get product journey', async () => {
      const response = await request(app)
        .get(`/api/products/${TEST_PRODUCT_ID}/journey`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('journey');
      expect(Array.isArray(response.body.journey)).toBe(true);
    });

    it('should get product provenance', async () => {
      const response = await request(app)
        .get(`/api/products/${TEST_PRODUCT_ID}/provenance`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('provenance');
    });

    it('should list products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('Transfer API', () => {
    it('should transfer product ownership', async () => {
      const transferData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        shipmentDetails: 'Test shipment'
      };

      const response = await request(app)
        .post('/api/transfers')
        .send(transferData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
    });

    it('should reject transfer with invalid address', async () => {
      const transferData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        toAddress: INVALID_ADDRESS,
        shipmentDetails: 'Test shipment'
      };

      const response = await request(app)
        .post('/api/transfers')
        .send(transferData);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should get transfer history', async () => {
      const response = await request(app)
        .get(`/api/transfers/${TEST_PRODUCT_ID}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('transfers');
      expect(Array.isArray(response.body.transfers)).toBe(true);
    });

    it('should batch transfer products', async () => {
      const batchData = {
        signerAddress: TEST_ADDRESS,
        productIds: [1, 2, 3],
        toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        shipmentDetails: 'Batch shipment'
      };

      const response = await request(app)
        .post('/api/transfers/batch')
        .send(batchData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Verification API', () => {
    it('should verify product authenticity', async () => {
      const verifyData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        notes: 'Verified by consumer'
      };

      const response = await request(app)
        .post('/api/verification/authenticity')
        .send(verifyData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('isValid');
      expect(typeof response.body.isValid).toBe('boolean');
    });

    it('should perform quality check', async () => {
      const qualityData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        qualityScore: 85,
        notes: 'Quality check passed'
      };

      const response = await request(app)
        .post('/api/verification/quality')
        .send(qualityData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
    });

    it('should reject quality check with invalid score', async () => {
      const qualityData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        qualityScore: 150, // Invalid: > 100
        notes: 'Invalid test'
      };

      const response = await request(app)
        .post('/api/verification/quality')
        .send(qualityData);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should perform compliance check', async () => {
      const complianceData = {
        signerAddress: TEST_ADDRESS,
        productId: TEST_PRODUCT_ID,
        compliant: true,
        certificateHash: 'QmCertificateHash'
      };

      const response = await request(app)
        .post('/api/verification/compliance')
        .send(complianceData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
    });

    it('should get verification history', async () => {
      const response = await request(app)
        .get(`/api/verification/${TEST_PRODUCT_ID}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('verifications');
      expect(Array.isArray(response.body.verifications)).toBe(true);
    });
  });

  describe('Role API', () => {
    it('should check user role', async () => {
      const response = await request(app)
        .get(`/api/roles/check/${TEST_ADDRESS}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('role');
    });

    it('should get my role', async () => {
      const response = await request(app)
        .get(`/api/roles/my-role?address=${TEST_ADDRESS}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('role');
    });

    it('should reject invalid address format', async () => {
      const response = await request(app)
        .get('/api/roles/check/invalid-address');
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should grant role to address', async () => {
      const grantData = {
        signerAddress: TEST_ADDRESS,
        accountAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        role: 0 // PRODUCER
      };

      const response = await request(app)
        .post('/api/roles/grant')
        .send(grantData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('transactionHash');
    });

    it('should reject grant role with invalid address', async () => {
      const grantData = {
        signerAddress: TEST_ADDRESS,
        accountAddress: INVALID_ADDRESS,
        role: 0
      };

      const response = await request(app)
        .post('/api/roles/grant')
        .send(grantData);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('QR Code API', () => {
    it('should generate QR code image', async () => {
      const response = await request(app)
        .get(`/api/qr/${TEST_PRODUCT_ID}`)
        .expect(200);
      
      expect(response.headers['content-type']).toContain('image/png');
    });

    it('should get QR code data', async () => {
      const response = await request(app)
        .get(`/api/qr/${TEST_PRODUCT_ID}/data`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should reject invalid product ID for QR', async () => {
      const response = await request(app)
        .get('/api/qr/invalid-id');
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe('Service Layer Tests', () => {
  
  describe('Contract Service', () => {
    it('should initialize contract service', async () => {
      await contractService.initialize();
      expect(contractService.provider).not.toBeNull();
    });

    it('should get user role', async () => {
      await contractService.initialize();
      const role = await contractService.getUserRole(TEST_ADDRESS);
      expect(typeof role).toBe('number');
      expect(role).toBeGreaterThanOrEqual(0);
      expect(role).toBeLessThanOrEqual(4);
    });

    it('should check if user has role', async () => {
      await contractService.initialize();
      const hasRole = await contractService.hasRole(TEST_ADDRESS, 0);
      expect(typeof hasRole).toBe('boolean');
    });
  });

  describe('QR Service', () => {
    it('should generate QR code data', () => {
      const qrData = qrService.getQRCodeData(TEST_PRODUCT_ID);
      expect(qrData).toHaveProperty('productId');
      expect(qrData).toHaveProperty('verifyUrl');
      expect(qrData.productId).toBe(TEST_PRODUCT_ID);
    });

    it('should generate QR code buffer', async () => {
      const buffer = await qrService.generateQRCodeBuffer(TEST_PRODUCT_ID);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });
});

describe('Utility Functions', () => {
  
  it('should validate Ethereum address', () => {
    expect(isValidAddress(TEST_ADDRESS)).toBe(true);
    expect(isValidAddress(INVALID_ADDRESS)).toBe(false);
    expect(isValidAddress('')).toBe(false);
    expect(isValidAddress('0x123')).toBe(false);
  });

  it('should validate product ID', () => {
    expect(isValidProductId(TEST_PRODUCT_ID)).toBe(true);
    expect(isValidProductId(INVALID_PRODUCT_ID)).toBe(false);
    expect(isValidProductId(0)).toBe(false);
    expect(isValidProductId(100)).toBe(true);
  });
});

describe('Error Handling', () => {
  
  it('should handle invalid routes', async () => {
    const response = await request(app)
      .get('/api/invalid-route')
      .expect(404);
  });

  it('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/products/register')
      .send({});
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle invalid data types', async () => {
    const response = await request(app)
      .post('/api/products/register')
      .send({
        signerAddress: TEST_ADDRESS,
        name: 123, // Invalid: should be string
        batchId: 'BATCH001',
        origin: 'Origin'
      });
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});


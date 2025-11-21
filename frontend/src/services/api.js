/**
 * API Service
 * Handles all backend API calls
 * 
 * TODO: Implement API calls
 * - Create axios instance with base URL
 * - Implement all API endpoints
 * - Handle errors
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Product API calls
 */
export const productAPI = {
  /**
   * Register a new product
   * POST /api/products/register
   * 
   * Makes POST request with product data and returns response.
   */
  register: async (data) => {
    return await api.post('/api/products/register', data);
  },

  /**
   * Get product by ID
   * GET /api/products/:id
   * 
   * Makes GET request and returns product data.
   */
  getById: async (productId) => {
    return await api.get(`/api/products/${productId}`);
  },

  /**
   * Get product journey
   * GET /api/products/:id/journey
   * 
   * Makes GET request and returns journey array.
   */
  getJourney: async (productId) => {
    return await api.get(`/api/products/${productId}/journey`);
  },

  /**
   * Get product provenance
   * GET /api/products/:id/provenance
   * 
   * Makes GET request and returns provenance data.
   */
  getProvenance: async (productId) => {
    return await api.get(`/api/products/${productId}/provenance`);
  },

  /**
   * List products
   * GET /api/products
   * 
   * Makes GET request with optional query params and returns products array.
   */
  list: async (params = {}) => {
    return await api.get('/api/products', { params });
  }
};

/**
 * Transfer API calls
 */
export const transferAPI = {
  /**
   * Transfer ownership
   * POST /api/transfers
   * 
   * Makes POST request and returns transaction hash.
   */
  transfer: async (data) => {
    return await api.post('/api/transfers', data);
  },

  /**
   * Batch transfer
   * POST /api/transfers/batch
   * 
   * Makes POST request and returns transaction hash.
   */
  batchTransfer: async (data) => {
    return await api.post('/api/transfers/batch', data);
  },

  /**
   * Get transfer history
   * GET /api/transfers/:productId
   * 
   * Makes GET request and returns transfer history.
   */
  getHistory: async (productId) => {
    return await api.get(`/api/transfers/${productId}`);
  }
};

/**
 * Verification API calls
 */
export const verificationAPI = {
  /**
   * Verify authenticity
   * POST /api/verification/authenticity
   * 
   * TODO:
   * 1. Make POST request
   * 2. Return verification result
   */
  verifyAuthenticity: async (data) => {
    // TODO: Implement
    return await api.post('/api/verification/authenticity', data);
  },

  /**
   * Perform quality check
   * POST /api/verification/quality
   * 
   * Makes POST request and returns transaction hash.
   */
  performQualityCheck: async (data) => {
    return await api.post('/api/verification/quality', data);
  },

  /**
   * Check compliance
   * POST /api/verification/compliance
   * 
   * TODO:
   * 1. Make POST request
   * 2. Return transaction hash
   */
  checkCompliance: async (data) => {
    // TODO: Implement
    return await api.post('/api/verification/compliance', data);
  },

  /**
   * Get verification history
   * GET /api/verification/:productId
   * 
   * TODO:
   * 1. Make GET request
   * 2. Return verification history
   */
  getHistory: async (productId) => {
    // TODO: Implement
    return await api.get(`/api/verification/${productId}`);
  }
};

/**
 * Role API calls
 */
export const roleAPI = {
  /**
   * Check role
   * GET /api/roles/check/:address
   * 
   * Makes GET request and returns role information.
   */
  check: async (address) => {
    return await api.get(`/api/roles/check/${address}`);
  },

  /**
   * Get my role
   * GET /api/roles/my-role?address=0x...
   * 
   * Makes GET request with address query param and returns role.
   */
  getMyRole: async (address) => {
    return await api.get('/api/roles/my-role', { params: { address } });
  }
};

/**
 * QR Code API calls
 */
export const qrAPI = {
  /**
   * Get QR code image
   * GET /api/qr/:productId
   * 
   * Makes GET request and returns image blob.
   */
  getImage: async (productId) => {
    return await api.get(`/api/qr/${productId}`, { responseType: 'blob' });
  },

  /**
   * Get QR code data
   * GET /api/qr/:productId/data
   * 
   * Makes GET request and returns QR data object.
   */
  getData: async (productId) => {
    return await api.get(`/api/qr/${productId}/data`);
  }
};

export default api;


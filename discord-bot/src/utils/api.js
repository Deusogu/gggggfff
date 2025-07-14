const axios = require('axios');

class API {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
      headers: {
        'x-api-key': process.env.API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
          throw new Error(error.response.data.message || 'API request failed');
        } else if (error.request) {
          // Request made but no response
          console.error('No response from API');
          throw new Error('No response from server');
        } else {
          // Request setup error
          console.error('Request error:', error.message);
          throw new Error('Failed to make request');
        }
      }
    );
  }

  // Product methods
  async updateProductStatus(productId, status, reason, sellerId) {
    const response = await this.client.put(`/products/${productId}/status`, {
      status,
      reason,
      sellerId
    });
    return response.data;
  }

  async addLicenseKeys(productId, keys, sellerId) {
    const response = await this.client.post(`/products/${productId}/keys`, {
      keys,
      sellerId
    });
    return response.data;
  }

  async getProductStock(productId, sellerId) {
    const response = await this.client.get(`/products/${productId}/keys`, {
      params: { sellerId }
    });
    return response.data;
  }

  async updateProductLinks(productId, instructionUrl, sellerId) {
    const response = await this.client.put(`/products/${productId}`, {
      instruction_url: instructionUrl,
      sellerId
    });
    return response.data;
  }

  async updateProductSupport(productId, supportContact, sellerId) {
    const response = await this.client.put(`/products/${productId}`, {
      support_contact: supportContact,
      sellerId
    });
    return response.data;
  }

  // Seller methods
  async getSellerSales(sellerId, limit = 10) {
    const response = await this.client.get('/orders/my-sales', {
      params: { sellerId, limit, sort: '-createdAt' }
    });
    return response.data;
  }

  async getSellerEarnings(sellerId) {
    const response = await this.client.get('/seller/earnings', {
      params: { sellerId }
    });
    return response.data;
  }

  async getSellerProducts(sellerId) {
    const response = await this.client.get('/products/seller/my-products', {
      params: { sellerId }
    });
    return response.data;
  }

  // Verify seller by Discord ID
  async verifySellerByDiscordId(discordId) {
    const response = await this.client.get('/users/discord/' + discordId);
    return response.data;
  }
}

module.exports = new API();

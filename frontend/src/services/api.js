import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          Cookies.remove('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 500:
          toast.error('Server error. Please try again later');
          break;
        default:
          toast.error(error.response.data.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection');
    } else {
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      Cookies.set('token', response.data.token, { expires: 7 });
    }
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      Cookies.set('token', response.data.token, { expires: 7 });
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    Cookies.remove('token');
    window.location.href = '/';
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  resendVerification: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
};

// Product services
export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getFeaturedProducts: async () => {
    const response = await api.get('/products/featured');
    return response.data;
  },

  getPopularGames: async () => {
    const response = await api.get('/products/games/popular');
    return response.data;
  },

  // Seller methods
  getMyProducts: async (params = {}) => {
    const response = await api.get('/products/seller/my-products', { params });
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  updateProductStatus: async (id, status, reason) => {
    const response = await api.put(`/products/${id}/status`, { status, reason });
    return response.data;
  },

  addLicenseKeys: async (id, keys) => {
    const response = await api.post(`/products/${id}/keys`, { keys });
    return response.data;
  },

  getProductKeys: async (id, params = {}) => {
    const response = await api.get(`/products/${id}/keys`, { params });
    return response.data;
  },
};

// Order services
export const orderService = {
  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getMyPurchases: async (params = {}) => {
    const response = await api.get('/orders/my-purchases', { params });
    return response.data;
  },

  getMySales: async (params = {}) => {
    const response = await api.get('/orders/my-sales', { params });
    return response.data;
  },

  checkPaymentStatus: async (id) => {
    const response = await api.get(`/orders/${id}/payment-status`);
    return response.data;
  },

  requestRefund: async (id, reason) => {
    const response = await api.post(`/orders/${id}/refund`, { reason });
    return response.data;
  },

  getOrderStats: async (period = '30d') => {
    const response = await api.get('/orders/stats', { params: { period } });
    return response.data;
  },
};

// Payment services
export const paymentService = {
  getPaymentDetails: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  getLtcPrice: async () => {
    const response = await api.get('/payments/ltc-price');
    return response.data;
  },

  convertCurrency: async (amount, from = 'USD', to = 'LTC') => {
    const response = await api.get('/payments/convert', {
      params: { amount, from, to }
    });
    return response.data;
  },

  checkTransaction: async (transactionId) => {
    const response = await api.get(`/payments/transaction/${transactionId}`);
    return response.data;
  },

  // Development only
  simulatePayment: async (orderId) => {
    const response = await api.post('/payments/simulate', { orderId });
    return response.data;
  },
};

// Seller services
export const sellerService = {
  getDashboard: async () => {
    const response = await api.get('/seller/dashboard');
    return response.data;
  },

  getEarnings: async (period = '30d', groupBy = 'day') => {
    const response = await api.get('/seller/earnings', {
      params: { period, groupBy }
    });
    return response.data;
  },

  requestPayout: async (amount) => {
    const response = await api.post('/seller/payout/request', { amount });
    return response.data;
  },

  updatePayoutAddress: async (address) => {
    const response = await api.put('/seller/payout/address', { address });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/seller/analytics');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/seller/profile', data);
    return response.data;
  },
};

// Admin services
export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  banUser: async (id, reason, duration) => {
    const response = await api.put(`/admin/users/${id}/ban`, { reason, duration });
    return response.data;
  },

  unbanUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/unban`);
    return response.data;
  },

  getPendingSellers: async () => {
    const response = await api.get('/admin/sellers/pending');
    return response.data;
  },

  approveSeller: async (id, commission) => {
    const response = await api.put(`/admin/sellers/${id}/approve`, { commission });
    return response.data;
  },

  rejectSeller: async (id, reason) => {
    const response = await api.put(`/admin/sellers/${id}/reject`, { reason });
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  toggleProductFeature: async (id) => {
    const response = await api.put(`/admin/products/${id}/feature`);
    return response.data;
  },

  getDisputes: async () => {
    const response = await api.get('/admin/disputes');
    return response.data;
  },

  resolveDispute: async (id, resolution) => {
    const response = await api.put(`/admin/disputes/${id}/resolve`, { resolution });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', { settings });
    return response.data;
  },

  getAnalytics: async (period = '30d') => {
    const response = await api.get('/admin/analytics', { params: { period } });
    return response.data;
  },
};

export default api;

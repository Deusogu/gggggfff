const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const publicOrderController = require('../controllers/publicOrderController');
const { protect, authorize, apiKeyAuth } = require('../middleware/auth');
const { orderValidation, commonValidation } = require('../middleware/validation');

// Public routes - no authentication required
router.post('/create', orderValidation.create, orderController.createOrder);
router.get('/public/:orderId', publicOrderController.getPublicOrder);
router.post('/public/:orderId/review', publicOrderController.submitReview);
router.get('/products/:productId/reviews', commonValidation.pagination, publicOrderController.getProductReviews);
router.get('/payment-status/:id', orderController.checkPaymentStatus);

// Protected routes - require authentication
router.use(protect);

// Buyer routes (for users with accounts)
router.get('/my-purchases', commonValidation.pagination, orderController.getBuyerOrders);
router.post('/:id/refund', commonValidation.mongoId('id'), orderController.requestRefund);

// Seller routes
router.get('/my-sales', authorize('seller'), commonValidation.pagination, orderController.getSellerOrders);
router.get('/stats', authorize('seller'), orderController.getOrderStats);

// Common routes (buyer or seller)
router.get('/:id', commonValidation.mongoId('id'), orderController.getOrder);

// Internal API routes (for payment webhook)
router.post('/process-payment', apiKeyAuth, orderController.processPayment);

module.exports = router;

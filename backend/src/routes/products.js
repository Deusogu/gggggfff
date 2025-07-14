const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize, requireSellerApproval, optionalAuth } = require('../middleware/auth');
const { productValidation, commonValidation } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, commonValidation.pagination, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/games/popular', productController.getPopularGames);
router.get('/:id', commonValidation.mongoId('id'), productController.getProduct);

// Protected routes - Seller only
router.use(protect);
router.use(authorize('seller', 'admin'));
router.use(requireSellerApproval);

// Seller products management
router.get('/seller/my-products', commonValidation.pagination, productController.getSellerProducts);
router.post('/', productValidation.create, productController.createProduct);
router.put('/:id', commonValidation.mongoId('id'), productValidation.update, productController.updateProduct);
router.delete('/:id', commonValidation.mongoId('id'), productController.deleteProduct);

// Product status and keys management
router.put('/:id/status', commonValidation.mongoId('id'), productValidation.updateStatus, productController.updateProductStatus);
router.post('/:id/keys', commonValidation.mongoId('id'), productValidation.addKeys, productController.addLicenseKeys);
router.get('/:id/keys', commonValidation.mongoId('id'), commonValidation.pagination, productController.getProductLicenseKeys);

module.exports = router;

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { paymentValidation } = require('../middleware/validation');

// Public routes
router.post('/webhook', paymentController.handleWebhook);
router.get('/methods', paymentController.getPaymentMethods);
router.get('/ltc-price', paymentController.getLtcPrice);
router.get('/convert', paymentController.convertCurrency);

// Protected routes
router.use(protect);

router.get('/order/:orderId', paymentController.getPaymentDetails);
router.get('/transaction/:transactionId', paymentController.checkTransaction);

// Development only route
if (process.env.NODE_ENV !== 'production') {
  router.post('/simulate', paymentController.simulatePayment);
}

module.exports = router;

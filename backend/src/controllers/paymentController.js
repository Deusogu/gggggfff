const Order = require('../models/Order');
const paymentService = require('../services/paymentService');
const crypto = require('crypto');

// Get payment details for an order
const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    }).populate('productId', 'name game price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment expired
    if (order.paymentStatus === 'pending' && 
        order.paymentDetails.expiresAt < new Date()) {
      order.paymentStatus = 'expired';
      order.status = 'failed';
      await order.save();
    }

    // Generate QR code
    const qrCode = paymentService.generateQRCode(
      order.paymentDetails.address,
      order.paymentDetails.amount
    );

    res.json({
      success: true,
      payment: {
        orderId: order.orderId,
        address: order.paymentDetails.address,
        amount: order.paymentDetails.amount,
        currency: order.paymentDetails.currency,
        qrCode,
        status: order.paymentStatus,
        expiresAt: order.paymentDetails.expiresAt,
        product: {
          name: order.productId.name,
          game: order.productId.game,
          price: order.productId.price
        }
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details'
    });
  }
};

// Webhook endpoint for payment notifications
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Process webhook
    const paymentData = await paymentService.processWebhook(req.body, signature);

    if (!paymentData.isConfirmed) {
      return res.json({
        success: true,
        message: 'Payment received, waiting for confirmations'
      });
    }

    // Find order by payment address
    const order = await Order.findOne({
      'paymentDetails.address': paymentData.address,
      status: 'pending'
    });

    if (!order) {
      console.error('Order not found for address:', paymentData.address);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify amount
    if (Math.abs(paymentData.amount - order.paymentDetails.amount) > 0.00000001) {
      console.error('Payment amount mismatch:', {
        expected: order.paymentDetails.amount,
        received: paymentData.amount
      });
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }

    // Process the payment through order controller
    const orderController = require('./orderController');
    req.body = {
      orderId: order.orderId,
      transactionId: paymentData.transactionId,
      confirmations: paymentData.confirmations
    };
    
    return orderController.processPayment(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
};

// Get current LTC price
const getLtcPrice = async (req, res) => {
  try {
    const price = await paymentService.getCurrentPrice();
    
    res.json({
      success: true,
      price: {
        currency: 'USD',
        value: price,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get LTC price error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching LTC price'
    });
  }
};

// Convert currency
const convertCurrency = async (req, res) => {
  try {
    const { amount, from = 'USD', to = 'LTC' } = req.query;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    let result;
    if (from === 'USD' && to === 'LTC') {
      result = await paymentService.convertUsdToLtc(parseFloat(amount));
    } else if (from === 'LTC' && to === 'USD') {
      const price = await paymentService.getCurrentPrice();
      result = (parseFloat(amount) * price).toFixed(2);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported currency conversion'
      });
    }

    res.json({
      success: true,
      conversion: {
        from: { currency: from, amount: parseFloat(amount) },
        to: { currency: to, amount: parseFloat(result) },
        rate: await paymentService.getCurrentPrice()
      }
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error converting currency'
    });
  }
};

// Check transaction status
const checkTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await paymentService.getTransaction(transactionId);
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Check transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking transaction'
    });
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    // In the future, you might support multiple cryptocurrencies
    const methods = [
      {
        id: 'litecoin',
        name: 'Litecoin',
        symbol: 'LTC',
        enabled: true,
        minAmount: 0.001,
        confirmationsRequired: 3,
        estimatedTime: '15-30 minutes',
        icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png'
      }
    ];

    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods'
    });
  }
};

// Simulate payment (for testing only - remove in production)
const simulatePayment = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    const { orderId } = req.body;
    
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Simulate webhook call
    const mockTransactionId = crypto.randomBytes(32).toString('hex');
    const orderController = require('./orderController');
    
    req.body = {
      orderId: order.orderId,
      transactionId: mockTransactionId,
      confirmations: 6
    };
    
    return orderController.processPayment(req, res);
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating payment'
    });
  }
};

module.exports = {
  getPaymentDetails,
  handleWebhook,
  getLtcPrice,
  convertCurrency,
  checkTransaction,
  getPaymentMethods,
  simulatePayment
};

const Order = require('../models/Order');
const Product = require('../models/Product');
const LicenseKey = require('../models/LicenseKey');
const User = require('../models/User');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');

// Create order (buyer - no account required)
const createOrder = async (req, res) => {
  try {
    const { productId, email } = req.body;
    const buyerId = req.user ? req.user._id : null;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Get product
    const product = await Product.findById(productId).populate('seller');
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check if product is available
    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently unavailable'
      });
    }

    // Check stock
    const availableKey = await LicenseKey.findAvailableKey(productId);
    if (!availableKey) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Calculate commission and seller earnings
    const commission = product.price * (product.commission || 0.15);
    const sellerEarnings = product.price - commission;

    // Create order
    const order = await Order.create({
      buyerId,
      buyerEmail: email,
      sellerId: product.sellerId,
      productId: product._id,
      productSnapshot: {
        name: product.name,
        game: product.game,
        price: product.price,
        duration: product.duration,
        instruction_url: product.instruction_url,
        support_contact: product.support_contact
      },
      amount: 1,
      total: product.price,
      commission,
      sellerEarnings,
      email: email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Generate payment address
    const paymentDetails = await paymentService.createPaymentAddress(order._id, product.price);
    
    order.paymentDetails = {
      address: paymentDetails.address,
      amount: paymentDetails.amount,
      currency: 'LTC',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
    
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderId: order.orderId,
        paymentAddress: paymentDetails.address,
        amount: paymentDetails.amount,
        currency: 'LTC',
        expiresAt: order.paymentDetails.expiresAt
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
};

// Get order details
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { 
      $or: [
        { _id: id },
        { orderId: id }
      ]
    };

    // If not admin, restrict to user's orders
    if (req.user.role !== 'admin') {
      query.$and = [
        { $or: query.$or },
        { $or: [
          { buyerId: req.user._id },
          { sellerId: req.user._id }
        ]}
      ];
    }

    const order = await Order.findOne(query)
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username sellerInfo.businessName')
      .populate('productId', 'name game');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sort = '-createdAt' } = req.query;
    const userId = req.user._id;

    const query = {
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('productId', 'name game')
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// Get buyer orders
const getBuyerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sort = '-createdAt' } = req.query;
    const buyerId = req.user._id;

    const query = { buyerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('productId', 'name game instruction_url support_contact')
      .populate('sellerId', 'username sellerInfo.businessName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// Get seller orders
const getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, productId, sort = '-createdAt' } = req.query;
    const sellerId = req.user._id;

    const query = { sellerId };
    if (status) query.status = status;
    if (productId) query.productId = productId;

    const orders = await Order.find(query)
      .populate('productId', 'name game')
      .populate('buyerId', 'username email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    // Calculate summary stats
    const stats = await Order.aggregate([
      { $match: { sellerId: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$sellerEarnings', 0] }
          },
          pendingRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$sellerEarnings', 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      orders,
      stats: stats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        pendingRevenue: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// Check order payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findOne({
      $or: [
        { _id: id },
        { orderId: id }
      ]
    });

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

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      status: order.status,
      expiresAt: order.paymentDetails.expiresAt
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status'
    });
  }
};

// Process payment webhook (internal)
const processPayment = async (req, res) => {
  try {
    const { orderId, transactionId, confirmations } = req.body;

    const order = await Order.findOne({ orderId })
      .populate('productId')
      .populate('sellerId')
      .populate('buyerId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order already processed'
      });
    }

    // Verify payment with payment service
    const isValid = await paymentService.verifyPayment(
      transactionId,
      order.total,
      order.paymentDetails.address
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment'
      });
    }

    // Assign license key
    const licenseKey = await LicenseKey.findAvailableKey(order.productId._id);
    if (!licenseKey) {
      return res.status(500).json({
        success: false,
        message: 'No license keys available'
      });
    }

    await licenseKey.assignToOrder(order._id, order.buyerId);

    // Complete order
    await order.completeOrder(licenseKey.key, transactionId);

    // Send emails
    await emailService.sendOrderConfirmation(order.email, order);
    await emailService.sendSellerNotification(order.sellerId.email, order);

    // Emit real-time updates
    const io = req.app.get('io');
    io.to(`buyer-${order.buyerId}`).emit('order-completed', {
      orderId: order.orderId,
      licenseKey: licenseKey.key
    });
    io.to(`seller-${order.sellerId._id}`).emit('new-sale', {
      orderId: order.orderId,
      earnings: order.sellerEarnings
    });

    res.json({
      success: true,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
};

// Request refund (buyer)
const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      $or: [
        { _id: id },
        { orderId: id }
      ],
      buyerId: req.user._id,
      status: 'completed'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for refund'
      });
    }

    // Check refund eligibility (e.g., within 24 hours)
    const hoursSincePurchase = (Date.now() - order.createdAt) / (1000 * 60 * 60);
    if (hoursSincePurchase > 24) {
      return res.status(400).json({
        success: false,
        message: 'Refund period has expired (24 hours)'
      });
    }

    // Open dispute
    await order.openDispute(reason);

    // Notify seller
    const io = req.app.get('io');
    io.to(`seller-${order.sellerId}`).emit('dispute-opened', {
      orderId: order.orderId,
      reason
    });

    res.json({
      success: true,
      message: 'Refund request submitted for review'
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting refund'
    });
  }
};

// Get order statistics (seller)
const getOrderStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const stats = await Order.aggregate([
      {
        $match: {
          sellerId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$sellerEarnings', 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Product performance
    const productStats = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalSales: { $sum: 1 },
          revenue: { $sum: '$sellerEarnings' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          game: '$product.game',
          totalSales: 1,
          revenue: 1
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    res.json({
      success: true,
      dailyStats: stats,
      productStats,
      period
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getUserOrders,
  getBuyerOrders,
  getSellerOrders,
  checkPaymentStatus,
  processPayment,
  requestRefund,
  getOrderStats
};

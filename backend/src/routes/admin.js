const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const LicenseKey = require('../models/LicenseKey');
const emailService = require('../services/emailService');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingSellerApprovals,
      activeDisputes,
      recentOrders
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, commission: { $sum: '$commission' } } }
      ]),
      User.countDocuments({ role: 'seller', 'sellerInfo.isApproved': false }),
      Order.countDocuments({ 'disputeInfo.isDisputed': true, status: 'disputed' }),
      Order.find()
        .sort('-createdAt')
        .limit(10)
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username sellerInfo.businessName')
        .populate('productId', 'name')
        .lean()
    ]);

    const revenue = totalRevenue[0] || { total: 0, commission: 0 };

    res.json({
      success: true,
      dashboard: {
        stats: {
          users: {
            total: totalUsers,
            sellers: totalSellers,
            buyers: totalUsers - totalSellers
          },
          products: {
            total: totalProducts
          },
          orders: {
            total: totalOrders
          },
          revenue: {
            total: revenue.total,
            commission: revenue.commission
          },
          pending: {
            sellerApprovals: pendingSellerApprovals,
            disputes: activeDisputes
          }
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, sort = '-createdAt' } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    let stats = {};
    if (user.role === 'seller') {
      const [products, orders, totalEarnings] = await Promise.all([
        Product.countDocuments({ sellerId: user._id }),
        Order.countDocuments({ sellerId: user._id }),
        Order.aggregate([
          { $match: { sellerId: user._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$sellerEarnings' } } }
        ])
      ]);
      
      stats = {
        products,
        orders,
        totalEarnings: totalEarnings[0]?.total || 0
      };
    } else if (user.role === 'buyer') {
      const [orders, totalSpent] = await Promise.all([
        Order.countDocuments({ buyerId: user._id }),
        Order.aggregate([
          { $match: { buyerId: user._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ]);
      
      stats = {
        orders,
        totalSpent: totalSpent[0]?.total || 0
      };
    }

    res.json({
      success: true,
      user,
      stats
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// Ban/unban user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { reason, duration } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    user.isBanned = true;
    user.banReason = reason;
    if (duration) {
      user.banExpiry = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    }
    await user.save();

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error banning user'
    });
  }
});

router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.banExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unbanning user'
    });
  }
});

// Seller approval
router.get('/sellers/pending', async (req, res) => {
  try {
    const pendingSellers = await User.find({
      role: 'seller',
      'sellerInfo.isApproved': false
    }).select('-password');

    res.json({
      success: true,
      sellers: pendingSellers
    });
  } catch (error) {
    console.error('Get pending sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending sellers'
    });
  }
});

router.put('/sellers/:id/approve', async (req, res) => {
  try {
    const { commission } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    user.sellerInfo.isApproved = true;
    user.sellerInfo.approvedAt = new Date();
    if (commission !== undefined) {
      user.sellerInfo.commission = commission;
    }
    await user.save();

    // Send approval email
    await emailService.sendSellerApproval(user.email, true);

    res.json({
      success: true,
      message: 'Seller approved successfully'
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving seller'
    });
  }
});

router.put('/sellers/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Send rejection email
    await emailService.sendSellerApproval(user.email, false, reason);

    res.json({
      success: true,
      message: 'Seller application rejected'
    });
  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting seller'
    });
  }
});

// Product management
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, seller, sort = '-createdAt' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (seller) query.sellerId = seller;

    const products = await Product.find(query)
      .populate('sellerId', 'username sellerInfo.businessName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Feature/unfeature product
router.put('/products/:id/feature', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Feature product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// Approve/reject product
router.put('/products/:id/approval', async (req, res) => {
  try {
    const { approvalStatus, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status'
      });
    }

    product.approvalStatus = approvalStatus;
    await product.save();

    // Notify seller
    const seller = await User.findById(product.sellerId);
    if (seller) {
      await emailService.sendProductApprovalNotification(
        seller.email,
        product.name,
        approvalStatus,
        reason
      );
    }

    res.json({
      success: true,
      message: `Product ${approvalStatus} successfully`,
      product
    });
  } catch (error) {
    console.error('Update product approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product approval'
    });
  }
});

// Freeze/unfreeze product
router.put('/products/:id/freeze', async (req, res) => {
  try {
    const { freeze, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (freeze) {
      product.isFrozen = true;
      product.frozenReason = reason;
      product.frozenAt = new Date();
      product.frozenBy = req.user._id;
    } else {
      product.isFrozen = false;
      product.frozenReason = null;
      product.frozenAt = null;
      product.frozenBy = null;
    }

    await product.save();

    res.json({
      success: true,
      message: `Product ${freeze ? 'frozen' : 'unfrozen'} successfully`,
      product
    });
  } catch (error) {
    console.error('Toggle product freeze error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product freeze status'
    });
  }
});

// Dispute management
router.get('/disputes', async (req, res) => {
  try {
    const disputes = await Order.find({
      'disputeInfo.isDisputed': true
    })
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username sellerInfo.businessName')
      .populate('productId', 'name')
      .sort('-disputeInfo.openedAt')
      .lean();

    res.json({
      success: true,
      disputes
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disputes'
    });
  }
});

router.put('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || !order.disputeInfo.isDisputed) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    await order.resolveDispute(resolution);

    res.json({
      success: true,
      message: 'Dispute resolved successfully'
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving dispute'
    });
  }
});

// Platform settings
router.get('/settings', async (req, res) => {
  try {
    // In production, load from database
    const settings = {
      commission: {
        default: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 0.15,
        min: 0.05,
        max: 0.30
      },
      payments: {
        minPayout: 0.1,
        payoutFrequency: 'weekly',
        supportedCurrencies: ['LTC']
      },
      limits: {
        maxProductsPerSeller: 50,
        maxKeysPerProduct: 10000,
        maxOrdersPerDay: 100
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    // In production, save to database
    const { settings } = req.body;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

// Analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

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
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue over time
    const revenueTimeline = await Order.aggregate([
      {
        $match: {
          status: 'completed',
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
          revenue: { $sum: '$total' },
          commission: { $sum: '$commission' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top sellers
    const topSellers = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$sellerId',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $project: {
          username: '$seller.username',
          businessName: '$seller.sellerInfo.businessName',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Popular games
    const popularGames = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$game',
          products: { $sum: 1 },
          totalSales: { $sum: '$totalSales' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        revenueTimeline,
        topSellers,
        popularGames,
        period
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize, requireSellerApproval } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const LicenseKey = require('../models/LicenseKey');

// Public route for Discord bot verification (no auth required)
router.get('/verify-discord/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    
    // Find user with this Discord ID
    const user = await User.findOne({ 
      discordId,
      role: 'seller'
    }).select('username email sellerInfo.isApproved sellerInfo.businessName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No seller found with this Discord ID'
      });
    }
    
    res.json({
      success: true,
      seller: {
        id: user._id,
        username: user.username,
        email: user.email,
        businessName: user.sellerInfo?.businessName,
        isApproved: user.sellerInfo?.isApproved || false
      }
    });
  } catch (error) {
    console.error('Discord verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying Discord ID'
    });
  }
});

// All routes below require seller authentication
router.use(protect);
router.use(authorize('seller'));

// Get seller dashboard data
router.get('/dashboard', requireSellerApproval, async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get seller stats
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      completedOrders,
      totalKeys,
      availableKeys,
      recentOrders,
      topProducts
    ] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Product.countDocuments({ sellerId, isActive: true }),
      Order.countDocuments({ sellerId }),
      Order.countDocuments({ sellerId, status: 'completed' }),
      LicenseKey.countDocuments({ sellerId }),
      LicenseKey.countDocuments({ sellerId, isUsed: false, isActive: true }),
      Order.find({ sellerId })
        .sort('-createdAt')
        .limit(10)
        .populate('productId', 'name')
        .populate('buyerId', 'username')
        .lean(),
      Product.find({ sellerId })
        .sort('-totalSales')
        .limit(5)
        .lean()
    ]);

    // Calculate earnings
    const earnings = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$sellerEarnings' },
          thisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: ['$createdAt', new Date(new Date().setDate(1))]
                },
                '$sellerEarnings',
                0
              ]
            }
          },
          today: {
            $sum: {
              $cond: [
                {
                  $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))]
                },
                '$sellerEarnings',
                0
              ]
            }
          }
        }
      }
    ]);

    const earningsData = earnings[0] || { total: 0, thisMonth: 0, today: 0 };

    res.json({
      success: true,
      dashboard: {
        stats: {
          products: {
            total: totalProducts,
            active: activeProducts
          },
          orders: {
            total: totalOrders,
            completed: completedOrders
          },
          keys: {
            total: totalKeys,
            available: availableKeys
          },
          earnings: {
            total: earningsData.total,
            thisMonth: earningsData.thisMonth,
            today: earningsData.today,
            pending: req.user.sellerInfo.pendingEarnings,
            withdrawn: req.user.sellerInfo.withdrawnEarnings
          }
        },
        recentOrders,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get seller earnings details
router.get('/earnings', requireSellerApproval, async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    const sellerId = req.user._id;

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
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Group format based on groupBy parameter
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const earnings = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$sellerEarnings' },
          orders: { $sum: 1 },
          commission: { $sum: '$commission' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get earnings by product
    const productEarnings = await Order.aggregate([
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
          revenue: { $sum: '$sellerEarnings' },
          orders: { $sum: 1 }
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
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          game: '$product.game',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      earnings: {
        timeline: earnings,
        byProduct: productEarnings,
        period,
        groupBy
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings data'
    });
  }
});

// Request payout
router.post('/payout/request', requireSellerApproval, async (req, res) => {
  try {
    const { amount } = req.body;
    const sellerId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount'
      });
    }

    // Check available balance
    if (amount > req.user.sellerInfo.pendingEarnings) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Check minimum payout amount (e.g., 0.1 LTC)
    const minPayout = 0.1;
    if (amount < minPayout) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ${minPayout} LTC`
      });
    }

    // Check if seller has payout address
    if (!req.user.sellerInfo.payoutAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please set your payout address first'
      });
    }

    // Create payout request (in production, you'd create a payout model)
    // For now, we'll just update the user's earnings
    const user = await User.findById(sellerId);
    user.sellerInfo.pendingEarnings -= amount;
    user.sellerInfo.withdrawnEarnings += amount;
    await user.save();

    // In production, create actual payout transaction
    // await paymentService.createPayout(user.sellerInfo.payoutAddress, amount, payoutId);

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      payout: {
        amount,
        address: user.sellerInfo.payoutAddress,
        status: 'pending',
        requestedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payout request'
    });
  }
});

// Update payout address
router.put('/payout/address', requireSellerApproval, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Payout address is required'
      });
    }

    // Basic Litecoin address validation
    if (!/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Litecoin address'
      });
    }

    const user = await User.findById(req.user._id);
    user.sellerInfo.payoutAddress = address;
    await user.save();

    res.json({
      success: true,
      message: 'Payout address updated successfully'
    });
  } catch (error) {
    console.error('Update payout address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payout address'
    });
  }
});

// Get sales analytics
router.get('/analytics', requireSellerApproval, async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get conversion rate
    const productViews = 1000; // In production, track actual views
    const totalOrders = await Order.countDocuments({ sellerId });
    const conversionRate = productViews > 0 ? (totalOrders / productViews * 100).toFixed(2) : 0;

    // Get average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$total' } } }
    ]);

    // Get customer retention (repeat buyers)
    const repeatBuyers = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      { $group: { _id: '$buyerId', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'repeatBuyers' }
    ]);

    const uniqueBuyers = await Order.distinct('buyerId', { sellerId, status: 'completed' });
    const retentionRate = uniqueBuyers.length > 0 
      ? ((repeatBuyers[0]?.repeatBuyers || 0) / uniqueBuyers.length * 100).toFixed(2)
      : 0;

    // Get best performing products
    const productPerformance = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      {
        $group: {
          _id: '$productId',
          revenue: { $sum: '$sellerEarnings' },
          orders: { $sum: 1 }
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
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          game: '$product.game',
          revenue: 1,
          orders: 1,
          avgOrderValue: { $divide: ['$revenue', '$orders'] }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        conversionRate: parseFloat(conversionRate),
        avgOrderValue: avgOrderValue[0]?.avg || 0,
        retentionRate: parseFloat(retentionRate),
        totalCustomers: uniqueBuyers.length,
        repeatCustomers: repeatBuyers[0]?.repeatBuyers || 0,
        productPerformance
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// Update seller profile
router.put('/profile', async (req, res) => {
  try {
    const { businessName, discordId } = req.body;

    const user = await User.findById(req.user._id);
    
    if (businessName) {
      user.sellerInfo.businessName = businessName;
    }
    
    // Handle Discord ID update
    if (discordId !== undefined) {
      // Validate Discord ID format if provided
      if (discordId && !/^\d{17,19}$/.test(discordId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Discord ID format. Must be 17-19 digits.'
        });
      }
      
      // Check if Discord ID is already taken by another user
      if (discordId) {
        const existingUser = await User.findOne({ 
          discordId,
          _id: { $ne: req.user._id }
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'This Discord ID is already linked to another account'
          });
        }
      }
      
      // Update Discord ID at root level (not in sellerInfo)
      user.discordId = discordId;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        businessName: user.sellerInfo.businessName,
        discordId: user.discordId
      }
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

module.exports = router;

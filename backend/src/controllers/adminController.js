const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Get all products for admin review
const getAdminProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      approvalStatus, 
      isFrozen,
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (isFrozen !== undefined) query.isFrozen = isFrozen === 'true';

    const products = await Product.find(query)
      .populate('sellerId', 'username email sellerInfo.businessName')
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
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

// Approve or reject product
const updateProductApproval = async (req, res) => {
  try {
    const { productId } = req.params;
    const { approvalStatus, reason } = req.body;

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.approvalStatus = approvalStatus;
    await product.save();

    // Notify seller
    const io = req.app.get('io');
    io.to(`seller-${product.sellerId}`).emit('product-approval-update', {
      productId: product._id,
      approvalStatus,
      reason
    });

    // Send email to seller
    const seller = await User.findById(product.sellerId);
    if (seller) {
      const emailService = require('../services/emailService');
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
};

// Freeze or unfreeze product
const toggleProductFreeze = async (req, res) => {
  try {
    const { productId } = req.params;
    const { freeze, reason } = req.body;

    const product = await Product.findById(productId);
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

    // Notify seller
    const io = req.app.get('io');
    io.to(`seller-${product.sellerId}`).emit('product-freeze-update', {
      productId: product._id,
      isFrozen: product.isFrozen,
      reason
    });

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
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
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

    // Overall stats
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingApprovals
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Product.countDocuments({ approvalStatus: 'pending' })
    ]);

    // Revenue stats
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalCommission: { $sum: '$commission' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Daily revenue chart
    const dailyRevenue = await Order.aggregate([
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
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
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
          totalSales: { $sum: 1 },
          revenue: { $sum: '$sellerEarnings' }
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
      {
        $unwind: '$seller'
      },
      {
        $project: {
          sellerName: '$seller.username',
          businessName: '$seller.sellerInfo.businessName',
          totalSales: 1,
          revenue: 1
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          pendingApprovals,
          ...(revenueStats[0] || {
            totalRevenue: 0,
            totalCommission: 0,
            totalOrders: 0
          })
        },
        dailyRevenue,
        topSellers,
        period
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform statistics'
    });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search,
      sort = '-createdAt' 
    } = req.query;

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
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
};

// Handle disputes
const getDisputes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'open' } = req.query;

    const query = { 'disputeInfo.isDisputed': true };
    if (status === 'open') {
      query['disputeInfo.resolvedAt'] = { $exists: false };
    } else if (status === 'resolved') {
      query['disputeInfo.resolvedAt'] = { $exists: true };
    }

    const disputes = await Order.find(query)
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username sellerInfo.businessName')
      .populate('productId', 'name game')
      .sort('-disputeInfo.openedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disputes'
    });
  }
};

// Resolve dispute
const resolveDispute = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { resolution, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order || !order.disputeInfo.isDisputed) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    await order.resolveDispute(resolution);
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      order
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving dispute'
    });
  }
};

// Create auto reviews for old orders
const createAutoReviews = async (req, res) => {
  try {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    // Find completed orders older than 31 days without reviews
    const ordersWithoutReviews = await Order.find({
      status: 'completed',
      createdAt: { $lte: thirtyOneDaysAgo }
    });

    let created = 0;
    for (const order of ordersWithoutReviews) {
      const review = await Review.createAutoReview(
        order._id,
        order.productId,
        order.buyerEmail || order.email
      );
      if (review) created++;
    }

    res.json({
      success: true,
      message: `Created ${created} auto reviews`
    });
  } catch (error) {
    console.error('Create auto reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating auto reviews'
    });
  }
};

module.exports = {
  getAdminProducts,
  updateProductApproval,
  toggleProductFreeze,
  getPlatformStats,
  getUsers,
  updateUserStatus,
  getDisputes,
  resolveDispute,
  createAutoReviews
};

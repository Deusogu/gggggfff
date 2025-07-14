const Product = require('../models/Product');
const LicenseKey = require('../models/LicenseKey');
const Order = require('../models/Order');

// Get all products (public)
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      game,
      status,
      minPrice,
      maxPrice,
      search,
      seller
    } = req.query;

    // Build query - only show approved and non-frozen products to buyers
    const query = { 
      isActive: true,
      approvalStatus: 'approved',
      isFrozen: false
    };

    if (game) {
      query.game = new RegExp(game, 'i');
    }

    if (status) {
      query.status = status;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { game: new RegExp(search, 'i') }
      ];
    }

    if (seller) {
      query.sellerId = seller;
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('seller', 'username sellerInfo.businessName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count
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
};

// Get single product (public)
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username sellerInfo.businessName sellerInfo.isApproved');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
};

// Create product (seller only)
const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      sellerId: req.user._id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product (seller only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      sellerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'sellerId') {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
};

// Delete product (seller only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      sellerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Check if there are active orders
    const activeOrders = await Order.countDocuments({
      productId: product._id,
      status: { $in: ['pending', 'completed'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with active orders'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
};

// Update product status (seller only)
const updateProductStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      sellerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    await product.updateStatus(status, reason);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('product-status-update', {
      productId: product._id,
      status,
      updatedAt: product.lastUpdated
    });

    res.json({
      success: true,
      message: 'Product status updated successfully',
      product
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status'
    });
  }
};

// Add license keys (seller only)
const addLicenseKeys = async (req, res) => {
  try {
    const { keys } = req.body;
    const productId = req.params.id;

    // Verify product ownership
    const product = await Product.findOne({
      _id: productId,
      sellerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Add keys
    const result = await LicenseKey.bulkAddKeys(productId, req.user._id, keys);

    // Update product stock count
    const stockCount = await LicenseKey.getStockCount(productId);
    product.stockCount = stockCount;
    await product.save();

    res.json({
      success: true,
      message: `Added ${result.added} license keys`,
      result,
      stockCount
    });
  } catch (error) {
    console.error('Add license keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding license keys'
    });
  }
};

// Get product license keys (seller only)
const getProductLicenseKeys = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const productId = req.params.id;

    // Verify product ownership
    const product = await Product.findOne({
      _id: productId,
      sellerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Build query
    const query = { productId };
    if (status === 'used') query.isUsed = true;
    if (status === 'available') query.isUsed = false;

    // Get keys
    const keys = await LicenseKey.find(query)
      .populate('orderId', 'orderId')
      .populate('usedBy', 'username email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await LicenseKey.countDocuments(query);

    res.json({
      success: true,
      keys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get license keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching license keys'
    });
  }
};

// Get seller products
const getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const products = await Product.find({ sellerId: req.user._id })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({ sellerId: req.user._id });

    // Get additional stats for each product
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const availableKeys = await LicenseKey.countDocuments({
          productId: product._id,
          isUsed: false,
          isActive: true
        });

        const totalKeys = await LicenseKey.countDocuments({
          productId: product._id
        });

        const recentSales = await Order.countDocuments({
          productId: product._id,
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        return {
          ...product,
          stats: {
            availableKeys,
            totalKeys,
            recentSales
          }
        };
      })
    );

    res.json({
      success: true,
      products: productsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isFeatured: true,
      status: 'undetected',
      approvalStatus: 'approved',
      isFrozen: false
    })
      .populate('seller', 'username sellerInfo.businessName')
      .sort('-rating -totalSales')
      .limit(10)
      .lean();

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products'
    });
  }
};

// Get popular games
const getPopularGames = async (req, res) => {
  try {
    const games = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$game', count: { $sum: 1 }, totalSales: { $sum: '$totalSales' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 20 },
      { $project: { game: '$_id', count: 1, totalSales: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Get popular games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular games'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  addLicenseKeys,
  getProductLicenseKeys,
  getSellerProducts,
  getFeaturedProducts,
  getPopularGames
};

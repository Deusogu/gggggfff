const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: function() {
      return 'ORD-' + uuidv4().substring(0, 8).toUpperCase();
    },
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Not required since buyers don't need accounts
    index: true
  },
  buyerEmail: {
    type: String,
    required: [true, 'Buyer email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    },
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productSnapshot: {
    name: String,
    game: String,
    price: Number,
    duration: String,
    instruction_url: String,
    support_contact: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    required: true,
    min: 0
  },
  sellerEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['litecoin', 'bitcoin', 'ethereum'],
    default: 'litecoin'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'expired'],
    default: 'pending',
    index: true
  },
  paymentDetails: {
    address: String,
    amount: Number,
    currency: String,
    transactionId: String,
    confirmations: Number,
    paidAt: Date,
    expiresAt: Date
  },
  license_key: {
    type: String,
    index: true
  },
  licenseKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LicenseKey'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending',
    index: true
  },
  deliveredAt: Date,
  refundedAt: Date,
  refundReason: String,
  disputeInfo: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: String,
    openedAt: Date,
    resolvedAt: Date,
    resolution: String
  },
  notes: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ paymentStatus: 1, status: 1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });

// Virtual for purchase date (alias for createdAt)
orderSchema.virtual('purchaseDate').get(function() {
  return this.createdAt;
});

// Virtual for formatted order info
orderSchema.virtual('formattedOrder').get(function() {
  return {
    orderId: this.orderId,
    amount: this.amount,
    total: this.total,
    purchaseTime: this.createdAt.toISOString(),
    email: this.email,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus === 'paid' ? '✓ paid' : this.paymentStatus,
    licenseKey: this.license_key,
    product: this.productSnapshot
  };
});

// Method to complete order
orderSchema.methods.completeOrder = async function(licenseKey, transactionId) {
  this.status = 'completed';
  this.paymentStatus = 'paid';
  this.license_key = licenseKey;
  this.deliveredAt = new Date();
  if (transactionId) {
    this.paymentDetails.transactionId = transactionId;
    this.paymentDetails.paidAt = new Date();
  }
  
  // Update seller earnings
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.sellerId, {
    $inc: {
      'sellerInfo.pendingEarnings': this.sellerEarnings
    }
  });
  
  // Update buyer purchase stats if buyer has an account
  if (this.buyerId) {
    await User.findByIdAndUpdate(this.buyerId, {
      $inc: {
        'buyerInfo.totalPurchases': 1,
        'buyerInfo.totalSpent': this.total
      }
    });
  }
  
  // Update product sales count
  const Product = mongoose.model('Product');
  await Product.findByIdAndUpdate(this.productId, {
    $inc: { totalSales: 1 }
  });
  
  return await this.save();
};

// Method to refund order
orderSchema.methods.refundOrder = async function(reason) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed orders');
  }
  
  this.status = 'refunded';
  this.paymentStatus = 'refunded';
  this.refundedAt = new Date();
  this.refundReason = reason;
  
  // Reverse seller earnings
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.sellerId, {
    $inc: {
      'sellerInfo.pendingEarnings': -this.sellerEarnings
    }
  });
  
  // Update buyer stats if buyer has an account
  if (this.buyerId) {
    await User.findByIdAndUpdate(this.buyerId, {
      $inc: {
        'buyerInfo.totalPurchases': -1,
        'buyerInfo.totalSpent': -this.total
      }
    });
  }
  
  // Update product sales count
  const Product = mongoose.model('Product');
  await Product.findByIdAndUpdate(this.productId, {
    $inc: { totalSales: -1 }
  });
  
  // Mark license key as unused
  if (this.licenseKeyId) {
    const LicenseKey = mongoose.model('LicenseKey');
    await LicenseKey.findByIdAndUpdate(this.licenseKeyId, {
      isUsed: false,
      orderId: null,
      usedAt: null
    });
  }
  
  return await this.save();
};

// Method to open dispute
orderSchema.methods.openDispute = async function(reason) {
  if (this.status !== 'completed') {
    throw new Error('Can only dispute completed orders');
  }
  
  this.disputeInfo = {
    isDisputed: true,
    reason: reason,
    openedAt: new Date()
  };
  this.status = 'disputed';
  
  return await this.save();
};

// Method to resolve dispute
orderSchema.methods.resolveDispute = async function(resolution) {
  if (!this.disputeInfo.isDisputed) {
    throw new Error('Order is not disputed');
  }
  
  this.disputeInfo.resolvedAt = new Date();
  this.disputeInfo.resolution = resolution;
  
  if (resolution === 'refund') {
    await this.refundOrder('Dispute resolved with refund');
  } else {
    this.status = 'completed';
  }
  
  return await this.save();
};

// Static method to expire old pending orders
orderSchema.statics.expirePendingOrders = async function() {
  const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
  
  const expiredOrders = await this.updateMany(
    {
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { $lt: expirationTime }
    },
    {
      status: 'failed',
      paymentStatus: 'expired'
    }
  );
  
  return expiredOrders;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

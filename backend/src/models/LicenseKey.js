const mongoose = require('mongoose');

const licenseKeySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  key: {
    type: String,
    required: [true, 'License key is required'],
    unique: true,
    trim: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: Date,
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  },
  notes: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
licenseKeySchema.index({ productId: 1, isUsed: 1, isActive: 1 });
licenseKeySchema.index({ sellerId: 1, productId: 1 });
licenseKeySchema.index({ orderId: 1 });

// Virtual for availability
licenseKeySchema.virtual('isAvailable').get(function() {
  return !this.isUsed && this.isActive && (!this.expiresAt || this.expiresAt > new Date());
});

// Method to assign key to order
licenseKeySchema.methods.assignToOrder = async function(orderId, userId) {
  if (this.isUsed) {
    throw new Error('License key is already used');
  }
  
  this.isUsed = true;
  this.orderId = orderId;
  this.usedBy = userId;
  this.usedAt = new Date();
  
  return await this.save();
};

// Method to release key (for refunds)
licenseKeySchema.methods.release = async function() {
  this.isUsed = false;
  this.orderId = null;
  this.usedBy = null;
  this.usedAt = null;
  
  return await this.save();
};

// Method to deactivate key
licenseKeySchema.methods.deactivate = async function(reason) {
  this.isActive = false;
  if (reason) {
    this.notes = (this.notes || '') + `\nDeactivated: ${reason} at ${new Date().toISOString()}`;
  }
  
  return await this.save();
};

// Static method to find available key for product
licenseKeySchema.statics.findAvailableKey = async function(productId) {
  return await this.findOne({
    productId: productId,
    isUsed: false,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to bulk add keys
licenseKeySchema.statics.bulkAddKeys = async function(productId, sellerId, keys) {
  const keyDocuments = keys.map(key => ({
    productId,
    sellerId,
    key: key.trim(),
    isUsed: false,
    isActive: true
  }));
  
  try {
    const result = await this.insertMany(keyDocuments, { ordered: false });
    return {
      success: true,
      added: result.length,
      keys: result
    };
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key errors
      const duplicates = error.writeErrors ? error.writeErrors.length : 0;
      const successful = keyDocuments.length - duplicates;
      
      return {
        success: false,
        added: successful,
        duplicates: duplicates,
        error: 'Some keys already exist'
      };
    }
    throw error;
  }
};

// Static method to get stock count
licenseKeySchema.statics.getStockCount = async function(productId) {
  return await this.countDocuments({
    productId: productId,
    isUsed: false,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to cleanup expired keys
licenseKeySchema.statics.cleanupExpiredKeys = async function() {
  const result = await this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      isActive: false,
      notes: 'Deactivated due to expiration'
    }
  );
  
  return result.modifiedCount;
};

// Pre-save middleware to validate key format
licenseKeySchema.pre('save', function(next) {
  // Remove any whitespace
  this.key = this.key.trim();
  
  // Validate key format (alphanumeric with dashes allowed)
  if (!/^[A-Za-z0-9\-]+$/.test(this.key)) {
    return next(new Error('Invalid license key format'));
  }
  
  next();
});

// Post-save middleware to update product stock count
licenseKeySchema.post('save', async function(doc) {
  const Product = mongoose.model('Product');
  const stockCount = await mongoose.model('LicenseKey').getStockCount(doc.productId);
  
  await Product.findByIdAndUpdate(doc.productId, {
    stockCount: stockCount
  });
});

// Post-remove middleware to update product stock count
licenseKeySchema.post('remove', async function(doc) {
  const Product = mongoose.model('Product');
  const stockCount = await mongoose.model('LicenseKey').getStockCount(doc.productId);
  
  await Product.findByIdAndUpdate(doc.productId, {
    stockCount: stockCount
  });
});

const LicenseKey = mongoose.model('LicenseKey', licenseKeySchema);

module.exports = LicenseKey;

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  game: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    enum: ['1 day', '7 days', '30 days', '90 days', '180 days', '365 days', 'lifetime'],
    default: '30 days'
  },
  status: {
    type: String,
    enum: ['undetected', 'detected', 'updating', 'discontinued'],
    default: 'undetected',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  isFrozen: {
    type: Boolean,
    default: false,
    index: true
  },
  frozenReason: String,
  frozenAt: Date,
  frozenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  screenshots: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  instruction_url: {
    type: String,
    required: [true, 'Instruction URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  support_contact: {
    type: String,
    required: [true, 'Support contact is required'],
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  requirements: {
    os: [{
      type: String,
      enum: ['Windows 10', 'Windows 11', 'Windows 10/11']
    }],
    cpu: String,
    ram: String,
    other: String
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  stockCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['undetected', 'detected', 'updating', 'discontinued']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  commission: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', game: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sellerId: 1, isActive: 1 });
productSchema.index({ game: 1, status: 1, isActive: 1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.isActive && 
         this.stockCount > 0 && 
         this.status !== 'discontinued' && 
         this.approvalStatus === 'approved' && 
         !this.isFrozen;
});

// Virtual for seller info (populated)
productSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

// Method to update stock
productSchema.methods.updateStock = async function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    if (this.stockCount < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stockCount -= quantity;
  } else if (operation === 'increase') {
    this.stockCount += quantity;
  }
  
  return await this.save();
};

// Method to update status with history
productSchema.methods.updateStatus = async function(newStatus, reason = '') {
  if (this.status !== newStatus) {
    this.statusHistory.push({
      status: this.status,
      reason: reason
    });
    this.status = newStatus;
    this.lastUpdated = Date.now();
    return await this.save();
  }
  return this;
};

// Method to calculate average rating
productSchema.methods.updateRating = async function(newRating, isNewReview = true) {
  if (isNewReview) {
    const totalRating = this.rating * this.totalReviews + newRating;
    this.totalReviews += 1;
    this.rating = totalRating / this.totalReviews;
  } else {
    // Recalculate from reviews
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ productId: this._id });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      this.rating = totalRating / reviews.length;
      this.totalReviews = reviews.length;
    } else {
      this.rating = 0;
      this.totalReviews = 0;
    }
  }
  return await this.save();
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Ensure commission is set
  if (this.commission === undefined) {
    this.commission = parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 0.15;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

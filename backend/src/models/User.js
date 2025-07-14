const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  discordId: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Discord IDs are 17-19 digit numbers
        return !v || /^\d{17,19}$/.test(v);
      },
      message: 'Invalid Discord ID format. Must be 17-19 digits.'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  sellerInfo: {
    businessName: {
      type: String,
      trim: true
    },
    payoutAddress: {
      type: String,
      trim: true
    },
    commission: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0
    },
    withdrawnEarnings: {
      type: Number,
      default: 0
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    discordId: String
  },
  buyerInfo: {
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpiry: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'sellerInfo.isApproved': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.verificationToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return token;
};

// Generate reset password token
userSchema.methods.generateResetPasswordToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

// Check if user is banned
userSchema.methods.checkBanStatus = function() {
  if (this.isBanned) {
    if (this.banExpiry && this.banExpiry < Date.now()) {
      this.isBanned = false;
      this.banReason = undefined;
      this.banExpiry = undefined;
      return false;
    }
    return true;
  }
  return false;
};

// Virtual for full profile
userSchema.virtual('profile').get(function() {
  const profile = {
    id: this._id,
    email: this.email,
    username: this.username,
    role: this.role,
    isVerified: this.isVerified,
    isActive: this.isActive,
    createdAt: this.createdAt
  };

  if (this.role === 'seller' && this.sellerInfo) {
    profile.sellerInfo = {
      businessName: this.sellerInfo.businessName,
      isApproved: this.sellerInfo.isApproved,
      totalEarnings: this.sellerInfo.totalEarnings,
      pendingEarnings: this.sellerInfo.pendingEarnings
    };
  }

  if (this.role === 'buyer' && this.buyerInfo) {
    profile.buyerInfo = {
      totalPurchases: this.buyerInfo.totalPurchases,
      totalSpent: this.buyerInfo.totalSpent
    };
  }

  return profile;
});

const User = mongoose.model('User', userSchema);

module.exports = User;

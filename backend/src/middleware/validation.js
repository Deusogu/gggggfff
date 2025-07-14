const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
      .optional()
      .isIn(['buyer', 'seller'])
      .withMessage('Invalid role'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors
  ]
};

// Product validation rules
const productValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 100 })
      .withMessage('Product name cannot exceed 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Product description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('game')
      .trim()
      .notEmpty()
      .withMessage('Game name is required'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    body('duration')
      .isIn(['1 day', '7 days', '30 days', '90 days', '180 days', '365 days', 'lifetime'])
      .withMessage('Invalid duration'),
    body('instruction_url')
      .isURL()
      .withMessage('Invalid instruction URL'),
    body('support_contact')
      .trim()
      .notEmpty()
      .withMessage('Support contact is required'),
    body('screenshots')
      .optional()
      .isArray()
      .withMessage('Screenshots must be an array'),
    body('screenshots.*')
      .optional()
      .isURL()
      .withMessage('Invalid screenshot URL'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Product name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    body('duration')
      .optional()
      .isIn(['1 day', '7 days', '30 days', '90 days', '180 days', '365 days', 'lifetime'])
      .withMessage('Invalid duration'),
    body('instruction_url')
      .optional()
      .isURL()
      .withMessage('Invalid instruction URL'),
    body('support_contact')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Support contact cannot be empty'),
    body('status')
      .optional()
      .isIn(['undetected', 'detected', 'updating', 'discontinued'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ],

  updateStatus: [
    body('status')
      .isIn(['undetected', 'detected', 'updating', 'discontinued'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .trim(),
    handleValidationErrors
  ],

  addKeys: [
    body('keys')
      .isArray({ min: 1 })
      .withMessage('Keys must be a non-empty array'),
    body('keys.*')
      .trim()
      .notEmpty()
      .withMessage('License key cannot be empty')
      .matches(/^[A-Za-z0-9\-]+$/)
      .withMessage('Invalid license key format'),
    handleValidationErrors
  ]
};

// Order validation rules
const orderValidation = {
  create: [
    body('productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    handleValidationErrors
  ],

  search: [
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'refunded', 'disputed'])
      .withMessage('Invalid status'),
    query('paymentStatus')
      .optional()
      .isIn(['pending', 'processing', 'paid', 'failed', 'refunded', 'expired'])
      .withMessage('Invalid payment status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    handleValidationErrors
  ]
};

// Payment validation rules
const paymentValidation = {
  webhook: [
    body('transactionId')
      .notEmpty()
      .withMessage('Transaction ID is required'),
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Invalid amount'),
    body('confirmations')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Invalid confirmations'),
    handleValidationErrors
  ]
};

// Common validation rules
const commonValidation = {
  mongoId: (paramName = 'id') => [
    param(paramName)
      .isMongoId()
      .withMessage('Invalid ID format'),
    handleValidationErrors
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .matches(/^-?[a-zA-Z_]+$/)
      .withMessage('Invalid sort format'),
    handleValidationErrors
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    handleValidationErrors
  ]
};

// Sanitization helpers
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any potential script tags
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Remove any potential SQL injection attempts
        obj[key] = obj[key].replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  userValidation,
  productValidation,
  orderValidation,
  paymentValidation,
  commonValidation,
  sanitizeInput,
  handleValidationErrors
};

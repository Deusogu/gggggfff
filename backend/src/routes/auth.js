const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

// Public routes
router.post('/register', userValidation.register, authController.register);
router.post('/login', userValidation.login, authController.login);
router.post('/logout', authController.logout);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', authController.getMe);
router.put('/profile', userValidation.updateProfile, authController.updateProfile);
router.put('/change-password', userValidation.changePassword, authController.changePassword);
router.post('/resend-verification', authController.resendVerification);

module.exports = router;

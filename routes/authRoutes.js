const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// Register Route
router.post('/register', register);

// Login Route
router.post('/login', login);

// Forgot Password Route
router.post('/forgotpassword', forgotPassword);

// Reset Password Route
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;

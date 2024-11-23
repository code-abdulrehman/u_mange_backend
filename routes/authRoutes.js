const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { check } = require('express-validator');

const router = express.Router();

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('first_name', 'First name is required').not().isEmpty(),
    check('skill', 'Skill is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  register
);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   POST /api/auth/forgotpassword
router.post('/forgotpassword', forgotPassword);

// @route   PUT /api/auth/resetpassword/:resettoken
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;

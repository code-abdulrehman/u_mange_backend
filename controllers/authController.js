const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path'); // For handling file paths
const fs = require('fs'); // For reading the HTML template


// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, first_name, last_name, email, password, skill, national_id, country } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    user = new User({
      username,
      first_name,
      last_name,
      email,
      password,
      skill,
      national_id,
      country
    });

    await user.save();

    const token = user.getSignedJwtToken();

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to e-setup!',
        template: 'welcomeTemplate.html',
        context: {
          first_name: user.first_name,
          login_url: `${process.env.CLIENT_URL}/login`,
        },

      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Optionally, handle email sending failure (e.g., log it, notify admin)
    }

    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password, peerId } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }


    if (peerId) {
      user.peerId = peerId;
      await user.save();
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (e.g., 10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });
    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/verify-token/${resetToken}`;

try {
  await sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    template: 'passwordResetTemplate.html',
    context: {
      reset_url: resetUrl,
    },
  });
} catch (emailError) {
  console.error('Error sending password reset email:', emailError);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });
  return res.status(500).json({ success: false, message: 'Email could not be sent' });
}    

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error(error);
    User.resetPasswordToken = undefined;
    User.resetPasswordExpire = undefined;
    await User.save({ validateBeforeSave: false });
    res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  // Get hashed token
  const hashedToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Optionally, send a confirmation email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Changed Successfully',
        template: 'passwordChangedTemplate.html',
        context: {
          first_name: user.first_name,
          email: user.email,
        },
      });
    } catch (emailError) {
      console.error('Error sending password changed confirmation email:', emailError);
      // Optionally, handle email sending failure
    }


    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
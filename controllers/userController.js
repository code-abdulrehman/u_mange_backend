const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { validationResult } = require('express-validator');

// @desc    Get all users (Admin & Super Admin)
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, Super Admin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, Super Admin)
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    const updates = req.body;

    // If role is being updated, send email notification
    if (updates.role && updates.role !== user.role) {
      const message = `Hello ${user.first_name},\n\nYour role has been updated to ${updates.role}.`;

      await sendEmail({
        email: user.email,
        subject: 'Role Update Notification',
        message,
      });
    }

    user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.remove();

    res.status(200).json({ success: true, message: 'User removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { validationResult } = require('express-validator');
const Team = require('../models/Team');
// @desc    Get all users (Admin & Super Admin)
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
// @desc    Get users (based on role)
// @route   GET /api/users
// @access  Private (Admin/Super Admin: All, User: Team Members)
exports.getUsers = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let users;

    if (role === 'admin' || role === 'super_admin') {
      // Admin and Super Admin: Fetch all users
      users = await User.find().select('-password');
    } else {
      // Regular User: Fetch only team members
      const teams = await Team.find({ members: userId }).select('members');
      const teamMemberIds = new Set(teams.flatMap((team) => team.members));

      users = await User.find({ _id: { $in: Array.from(teamMemberIds) } }).select(
        'username email skill expertise'
      );
    }

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Error fetching users:', error.message);
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


// @desc    Get list of all expertise
// @route   GET /api/users/expertise
// @access  Private (Admin, Super Admin)
exports.getExpertiseList = async (req, res) => {
  try {
    const expertise = await User.distinct('expertise');
    res.status(200).json({ success: true, data: expertise });
  } catch (error) {
    console.error('Error fetching expertise list:', error.message);
    res.status(500).send('Server Error');
  }
};

// @access  Private (Admin, Super Admin)
exports.getCountriesList = async (req, res) => {
  try {
    const countries = await User.distinct('country');
    res.status(200).json({ success: true, data: countries });
  } catch (error) {
    console.error('Error fetching countries list:', error.message);
    res.status(500).send('Server Error');
  }
};

exports.getUserPeerIds = async (req, res) => {
  try {
    const users = await User.find().select('peerId first_name last_name');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching peerIds:', error.message);
    res.status(500).send('Server Error');
  }
};
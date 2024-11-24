const User = require('../models/User');
const { validationResult } = require('express-validator');
const Setting = require('../models/Setting');
// @desc    Get all roles and permissions
// @route   GET /api/admin/roles
// @access  Private (Super Admin)
exports.getRoles = async (req, res) => {
  // Define roles and permissions
  const roles = {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['read', 'update'],
    user: ['read'],
  };

  res.status(200).json({ success: true, data: roles });
};

// @desc    Update roles and permissions
// @route   PUT /api/admin/roles
// @access  Private (Super Admin)
exports.updateRoles = async (req, res) => {
  const { role, permissions } = req.body;

  try {
    let user = await User.findOne({ role });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Update permissions logic
    // This is a placeholder as roles are defined statically
    // For dynamic roles, you'd have a Role model to update

    res.status(200).json({ success: true, message: 'Roles updated successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.updateFee = async (req, res) => {
  const { feePercentage } = req.body;

  if (typeof feePercentage !== 'number' || feePercentage < 0) {
    return res.status(400).json({ success: false, message: 'Invalid fee percentage' });
  }

  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = new Setting({ feePercentage });
    } else {
      settings.feePercentage = feePercentage;
    }

    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating fee percentage:', error.message);
    res.status(500).send('Server Error');
  }
};

// routes/adminRoutes.js

const express = require('express');
const { getRoles, updateRoles, updateFee } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and require Super Admin role
router.use(protect);
router.use(authorizeRoles('super_admin'));

// @route   GET /api/admin/roles
router.get('/roles', getRoles);

// @route   PUT /api/admin/roles
router.put('/roles', updateRoles);

// @route   PUT /api/admin/fee
router.put('/fee', updateFee);

module.exports = router;

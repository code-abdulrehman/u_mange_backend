const express = require('express');
const { processPayment, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and require Admin or Super Admin roles
router.use(protect);
router.use(authorizeRoles('admin', 'super_admin'));

// @route   POST /api/payments
router.post('/', processPayment);

// @route   GET /api/payments/user/:userId
router.get('/user/:userId', getPayments);

module.exports = router;

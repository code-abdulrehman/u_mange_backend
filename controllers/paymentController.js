const Payment = require('../models/Payment');
const User = require('../models/User');
const dotenv = require('dotenv');
const sendEmail = require('../utils/sendEmail');

dotenv.config();

// @desc    Process a new payment
// @route   POST /api/payments
// @access  Private (Authenticated Users)
exports.processPayment = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Find the user receiving the payment
    const recipient = await User.findById(userId);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Calculate fee if recipient is superadmin
    let fee = 0;
    if (recipient.role === 'super_admin') {
      fee = parseFloat((amount * 0.005).toFixed(2)); // 0.5% fee
    }

    // Total amount after fee
    const totalAmount = fee > 0 ? parseFloat((amount + fee).toFixed(2)) : amount;

    // Create a new payment
    const payment = new Payment({
      user: userId,
      amount: amount,
      fee: fee,
      total_amount: totalAmount,
      status: 'pending',
      processed_by: req.user.id,
    });

    await payment.save();

    // Update recipient's payment records
    recipient.payments.push(payment._id);
    await recipient.save();

    // If fee exists, add it to superadmin's account
    if (fee > 0) {
      const superAdminId = process.env.SUPERADMIN_USER_ID;
      const superAdmin = await User.findById(superAdminId);

      if (superAdmin) {
        superAdmin.payments.push(payment._id);
        await superAdmin.save();

        // Optionally, notify superadmin via email
        const message = `Hello ${superAdmin.first_name},\n\nA transaction of $${fee} has been added as a fee from a payment of $${amount}.`;

        await sendEmail({
          email: superAdmin.email,
          subject: 'Transaction Fee Applied',
          message,
        });
      }
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Error in processPayment:', error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (Admin, Super Admin)
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('user', 'username email');
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    console.error('Error in getPayments:', error.message);
    res.status(500).send('Server Error');
  }
};

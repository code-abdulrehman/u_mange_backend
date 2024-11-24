const Payment = require('../models/Payment');
const User = require('../models/User');
const dotenv = require('dotenv');
const sendEmail = require('../utils/sendEmail');
const Setting = require('../models/Setting');
dotenv.config();

// @desc    Process a new payment
// @route   POST /api/payments
// @access  Private (Authenticated Users)

exports.processPayment = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Fetch current fee percentage
    const settings = await Setting.findOne();
    const feePercentage = settings ? settings.feePercentage : 0.7;

    // Find the user receiving the payment
    const recipient = await User.findById(userId);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Calculate fee
    const fee = parseFloat(((amount * feePercentage) / 100).toFixed(2)); // 0.7% fee
    const totalAmount = parseFloat((amount + fee).toFixed(2));

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

    // Add fee to Super Admin's account
      // Add fee to the earliest registered Super Admin's account
      const superAdmin = await User.findOne({ role: 'super_admin' }).sort({ createdAt: 1 });


    if (superAdmin) {
      superAdmin.payments.push(payment._id);
      await superAdmin.save();

      
    await sendEmail({
      email: superAdmin.email,
        subject: `Payment Received`,
        template: 'paymentTemplate.html',
        context: {
          team_name: recipient.username, 
          amount: fee,
        },
    });
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

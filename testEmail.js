// testEmail.js

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Optional: Debugging to ensure variables are loaded
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS);
console.log('From Email:', process.env.FROM_EMAIL);

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Corrected
    pass: process.env.EMAIL_PASS, // Corrected
  },
});

// Verify the connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take messages');
    
    // Send a test email
    const mailOptions = {
      from: process.env.FROM_EMAIL, // Updated to exclude FROM_NAME
      to: 'hy.abdulrahman2@gmail.com', // Replace with your test email
      subject: 'Test Email from Nodemailer',
      text: 'Hello! This is a test email sent from Nodemailer.',
      html: '<p>Hello! This is a <strong>test email</strong> sent from Nodemailer.</p>',
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending test email:', err);
      } else {
        console.log('Test Email sent:', info.messageId);
      }
    });
  }
});

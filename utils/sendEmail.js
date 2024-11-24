const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Verify essential environment variables
const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'FROM_EMAIL'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1); // Exit the application if a required variable is missing
  }
});

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // Use 'true' if secure connection is required
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take messages');
  }
});

/**
 * Send an email using Nodemailer with Handlebars templates and attachments.
 * @param {Object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} [options.template] - Specific email template filename.
 * @param {Object} [options.context] - Context data for the specific template.
 * @param {Array} [options.attachments] - Array of attachment objects.
 */
const sendEmail = async (options) => {
  try {
    let htmlToSend = '';

    if (options.template) {
      // Path to the specific email template
      const templatePath = path.join(__dirname, '../templates', options.template);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found at path: ${templatePath}`);
      }

      // Read the specific template
      const specificTemplateSource = fs.readFileSync(templatePath, 'utf8');
      const specificTemplate = handlebars.compile(specificTemplateSource);
      const specificBody = specificTemplate(options.context);

      // Read the master layout
      const masterTemplatePath = path.join(__dirname, '../templates/layouts/masterTemplate.html');
      if (!fs.existsSync(masterTemplatePath)) {
        throw new Error(`Master template not found at path: ${masterTemplatePath}`);
      }

      const masterTemplateSource = fs.readFileSync(masterTemplatePath, 'utf8');
      const masterTemplate = handlebars.compile(masterTemplateSource);

      // Generate the final HTML by injecting the specific body into the master layout
      htmlToSend = masterTemplate({
        subject: options.subject,
        body: specificBody,
        year: new Date().getFullYear(),
      });
    } else {
      throw new Error('A specific email template must be provided');
    }

    // Define the email options
    const mailOptions = {
      from: process.env.FROM_EMAIL, // Sender address
      to: options.email, // Recipient address
      subject: options.subject, // Subject line
      html: htmlToSend,
    };


    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;

  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error; // Re-throw the error to handle it in the controller
  }
};

module.exports = sendEmail;

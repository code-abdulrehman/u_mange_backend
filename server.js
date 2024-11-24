// server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const Setting = require('./models/Setting');
const { ExpressPeerServer } = require('peer');
const http = require('http'); // Import the HTTP module
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(mongoSanitize());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});


app.use(limiter);
app.use(express.json());
app.use(cors());

// Initialize settings if not present
const initializeSettings = async () => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      await Setting.create({ feePercentage: 0.7 });
      console.log('Settings initialized.');
    }
  } catch (error) {
    console.error('Error initializing settings:', error.message);
  }
};

initializeSettings();

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));

// Error Handling Middleware (Optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs',
});

// Use PeerJS server middleware
app.use('/peerjs', peerServer);

// Define PORT
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

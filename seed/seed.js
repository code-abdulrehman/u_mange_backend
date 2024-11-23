const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany();

    // Create Super Admin
    const superAdmin = new User({
      username: 'superadmin',
      first_name: 'Super',
      last_name: 'Admin',
      email: 'code.abdulrehman@gmail.com',
      password: 'password123',
      skill: "Frontend Devloper",
      role: 'super_admin',
    });

    await superAdmin.save();

    console.log('Seeding completed');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();

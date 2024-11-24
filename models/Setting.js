// models/Setting.js

const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  feePercentage: { type: Number, default: 0.7 }, // Default to 0.7%
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);

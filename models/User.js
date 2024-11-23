const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  skill: { type: String, required: true },
  expertise: [{ type: String }],
  per_hour_rate: { type: Number, default: 0 },
  address: { type: String },
  natila_id: { type: String, unique: true },
  country: { type: String },
  education: { type: String },
  experience: { type: String },
  online_time_from: { type: String },
  online_time_to: { type: String },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  work_history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  last_online: { type: Date },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  requests: [{ type: String }],
  profile_img: { type: String },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  invitationToken: String,
  invitationExpire: Date,
  invitedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
}, { timestamps: true });

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', UserSchema);

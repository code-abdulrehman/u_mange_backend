const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const InvitationSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  token: { type: String, required: true },        
  expireAt: { 
    type: Date, 
    index: { expireAfterSeconds: 0 }
  },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
});

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] 
    },
    skill: { type: String, required: true },
    expertise: [{ type: String }],
    per_hour_rate: { type: Number, default: 0, min: 0 },
    address: { type: String },
    national_id: { type: String },
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
    invitations: [ InvitationSchema ],
    role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
    requests: [{ type: String }],
    profile_img: { type: String },
    peerId: { type: String },
    password: { type: String, required: true, minlength: 6 },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    invitationToken: String,
    invitationExpire: Date,
    invitedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  },
  { timestamps: true }
);

UserSchema.virtual('fullName').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

UserSchema.virtual('invitesCount').get(function () {
  return this.invitations.length;
});

UserSchema.virtual('acceptedTeams').get(function () {
  return this.teams.length;
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.generatePeerId = function () {
  this.peerId = crypto.randomBytes(16).toString('hex');
  return this.peerId;
};

module.exports = mongoose.model('User', UserSchema);
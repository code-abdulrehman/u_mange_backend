const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['W', 'R', 'D', 'E'], default: 'W' }, // W: Write, R: Read, D: Delete, E: Edit
  images: [{ type: String }],
  payment_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  review: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);

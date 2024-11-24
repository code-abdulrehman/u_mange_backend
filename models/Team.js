const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  permissions: {
    create: { type: Boolean, default: true },
    delete: { type: Boolean, default: false },
    read: { type: Boolean, default: true },
    edit: { type: Boolean, default: false },
    chat: { type: Boolean, default: true }, // New field for chat permissions
  },
  max_tasks: { type: Number, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);

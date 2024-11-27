const mongoose = require('mongoose');
const User = require('./User');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  invitationToken: { type: String, required: false },
  invitationExpire: { type: Date, required: false },
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

// In your Team model (models/Team.js)
TeamSchema.pre('remove', async function (next) {
  await User.updateMany(
    { 'invitations.team': this._id },
    { $pull: { invitations: { team: this._id } } }
  );
  next();
});

module.exports = mongoose.model('Team', TeamSchema);

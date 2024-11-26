const mongoose = require('mongoose');
const crypto = require('crypto');

// User schema
const UserSchema = new mongoose.Schema({
  invitations: [
    {
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      token: String,
      expireAt: {
        type: Date,
        index: { expireAfterSeconds: 0 },
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending',
      },
    },
  ],
});

const User = mongoose.model('User', UserSchema);

// Connect to MongoDB
mongoose
  .connect('db string', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected');
    await migrateInvitations();
    mongoose.disconnect(); // Disconnect after migration
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });

// Migration function
const migrateInvitations = async () => {
  try {
    const users = await User.find({ invitations: { $exists: true } }); // Find users with invitations
    for (const user of users) {
      const updatedInvitations = user.invitations.map((teamId) => ({
        team: teamId, // Assign the old ObjectId to the team field
        token: generateToken(), // Generate a new token for each invitation
        expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to expire in 7 days
        status: 'pending', // Default status
      }));

      user.invitations = updatedInvitations;
      await user.save();
    }
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error.message);
  }
};

// Helper function to generate tokens
const generateToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

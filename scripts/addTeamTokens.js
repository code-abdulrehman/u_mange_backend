// scripts/addTeamTokens.js
const mongoose = require('mongoose');
const Team = require('../models/Team'); // Adjust the path as necessary
const crypto = require('crypto');

const addTokensToTeams = async () => {
  try {
    await mongoose.connect('mongodb+srv://codeabdulrehman:%7BAa%40123%7D@cluster0.x1opu.mongodb.net/e-setup-db?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const teams = await Team.find({ invitationToken: { $exists: false } });

    for (let team of teams) {
      team.invitationToken = crypto.randomBytes(20).toString('hex');
      team.invitationExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      await team.save();
      console.log(`Added invitationToken to team: ${team.name}`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error(error);
    mongoose.disconnect();
  }
};

addTokensToTeams();

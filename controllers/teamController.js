const Team = require('../models/Team');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Admin, Super Admin)
exports.createTeam = async (req, res) => {
  const { name, members } = req.body;

  try {
    const team = new Team({
      name,
      members,
      created_by: req.user.id,
    });

    await team.save();

    // Add team to users' teams array
    await User.updateMany(
      { _id: { $in: members } },
      { $push: { teams: team._id } }
    );

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Invite a member to a team
// @route   POST /api/teams/:teamId/invite
// @access  Private (Team Lead, Admin, Super Admin)
exports.inviteMember = async (req, res) => {
  const { email } = req.body;
  const { teamId } = req.params;

  try {
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check if already a member
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (team.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User is already a team member' });
    }


    // Generate invitation token
    const inviteToken = crypto.randomBytes(20).toString('hex');
    const hashedInviteToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

    // Set invitation token and expiration in user document
    user.invitationToken = hashedInviteToken;
    user.invitationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.invitedTeam = team._id;

    await user.save({ validateBeforeSave: false });

    // Create invitation URL
    const inviteUrl = `${process.env.CLIENT_URL}/teams/teaminvite/${inviteToken}`;

    await sendEmail({
      email: user.email,
      subject: `Invitation to Join Team: ${team.name}`,
      template: 'invitationTemplate.html',
      context: {
        team_name: team.name,
        inviter_name: req.user.first_name || 'Team Lead', // Assuming req.user has first_name
        invite_url: inviteUrl,
      },
    });
;

    // Add to invitations
    user.invitations.push(team._id);
    await user.save();

    res.status(200).json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Accept team invitation
// @route   POST /api/teams/:teamId/accept
// @access  Private (User)
exports.acceptInvitation = async (req, res) => {
  const { inviteToken } = req.params;
  const { password } = req.body; // Optionally, set a password if user is not registered

  try {
    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

    // Find user with matching invitation token and not expired
    const user = await User.findOne({
      invitationToken: hashedToken,
      invitationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
    }

    // Add user to team
    const team = await Team.findById(user.invitedTeam);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.members.push(user._id);
    await team.save();

    // Add team to user's teams
    user.teams.push(team._id);

    // Clear invitation fields
    user.invitationToken = undefined;
    user.invitationExpire = undefined;
    user.invitedTeam = undefined;

    // Optionally, set password if provided
    if (password) {
      user.password = password;
    }

    await user.save();

     // Optionally, send confirmation email to inviter
     const inviter = await User.findById(team.created_by); // Assuming 'created_by' is the inviter

     if (inviter) {
       await sendEmail({
         email: inviter.email,
         subject: 'Your Team Invitation Has Been Accepted',
         template: 'invitationAcceptedTemplate2.html',
         context: {
           invitee_name: user.first_name,
           team_name: team.name,
         }
       });
     }

     await sendEmail({
      email: user.email,
      subject: `Welcome to the Team: ${team.name}`,
      template: 'invitationAcceptedTemplate.html', // Reuse welcome template or create a specific one
      context: {
        first_name:  user.first_name,
        team_name: team.name,
        team_url: `${process.env.CLIENT_URL}/teams/team/${team.id}`,
      }
    });



    res.status(200).json({ success: true, message: 'Invitation accepted and team joined successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private (Admin, Super Admin, Team Members)
exports.getTeams = async (req, res) => {
  try {
    let teams;

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      teams = await Team.find().populate('members', 'username email  skill per_hour_rate expertise');
    } else {
      teams = await Team.find({ members: req.user.id }).populate('members', 'username email skill per_hour_rate expertise');
    }

    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private (Admin, Super Admin, Team Members)
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'username email skill per_hour_rate expertise')
      .populate('created_by', 'username email');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Authorization: Admins, Super Admins, or team members can view the team
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin' &&
      !team.members.some(member => member._id.toString() === req.user.id)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this team' });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (Admin, Super Admin, Team Creator)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Authorization: Admins, Super Admins, or the user who created the team can delete it
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin' &&
      team.created_by.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team' });
    }

    // Remove team from all members' teams array
    await User.updateMany(
      { _id: { $in: team.members } },
      { $pull: { teams: team._id } }
    );

    // Optionally, handle tasks associated with the team
    // For example, you might want to delete all tasks under this team or reassign them

    // Finally, delete the team
    await team.remove();

    res.status(200).json({ success: true, message: 'Team removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
};
const Team = require('../models/Team');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Create a new 
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
// exports.inviteMember = async (req, res) => {
//   const { email } = req.body;
//   const { teamId } = req.params;

//   try {
//     const team = await Team.findById(teamId);

//     if (!team) {
//       return res.status(404).json({ success: false, message: 'Team not found' });
//     }

//     // Check if already a member
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     if (team.members.includes(user._id)) {
//       return res.status(400).json({ success: false, message: 'User is already a team member' });
//     }
//         // Check if an active invitation already exists
//         const existingInvite = user.invitations.find(
//           (invite) => invite.team.toString() === team._id.toString() && invite.status === 'pending'
//         );
//         if (existingInvite) {
//           return res.status(400).json({ success: false, message: 'Invitation already sent' });
//         }


//     // Generate invitation token
//     const inviteToken = crypto.randomBytes(20).toString('hex');
//     const hashedInviteToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

//     // Set invitation token and expiration in user document
//     user.invitationToken = hashedInviteToken;
//     user.invitationExpire = Date.now() + 10 * 24 * 60 * 60 * 1000;// 10 days
//     user.invitedTeam = team._id;

//     await user.save({ validateBeforeSave: false });

//     // Create invitation URL
//     const inviteUrl = `${process.env.CLIENT_URL}/teams/teaminvite/${inviteToken}`;

//     await sendEmail({
//       email: user.email,
//       subject: `Invitation to Join Team: ${team.name}`,
//       template: 'invitationTemplate.html',
//       context: {
//         team_name: team.name,
//         inviter_name: req.user.first_name || 'Team Lead', // Assuming req.user has first_name
//         invite_url: inviteUrl,
//       },
//     });
// ;

//     // Add to invitations
//     user.invitations.push(team._id);
//     await user.save();

//     res.status(200).json({ success: true, message: 'Invitation sent' });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server Error');
//   }
// };

exports.inviteMember = async (req, res) => {
  const { email } = req.body;
  const teamId = req.params.teamId;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure the user is not already a member of the team
    if (team.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User is already a team member' });
    }

    // Generate a unique token for the invitation
    const token = crypto.randomBytes(16).toString('hex');

    // Add the invitation
    user.invitations.push({
      team: team._id,
      token: token,
      expireAt: new Date(Date.now() + 3600000 * 24) // 24 hours from now
    });


    // Create invitation URL
    const inviteUrl = `${process.env.CLIENT_URL}/teams/teaminvite/${token}`;

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

    await user.save();
    res.status(201).json({ success: true, message: 'User invited successfully' });
  } catch (error) {
    console.error('Failed to invite user:', error);
    res.status(500).send('Server Error');
  }
};


// @desc    Get all invites (to and from based on user role)
// @route   GET /api/teams/invites
// @access  Private (Super Admin: All, Others: Restricted)
// exports.getAllInvites = async (req, res) => {
//   try {
//     const { role, id: userId } = req.user;

//     let toInvites, fromInvites;

//     if (role === 'super_admin') {
//       // Super Admin: Get all incoming and outgoing invites
//       toInvites = await User.find({ invitationToken: { $exists: true } })
//         .select('invitations invitationToken invitationExpire')
//         .populate({
//           path: 'invitations',
//           select: 'name created_by',
//           populate: { path: 'created_by', select: 'username email' },
//         });
//         toInvites = await User.find({ 'invitations.status': { $exists: true } })
//         .select('invitations')
//         .populate({
//           path: 'invitations.team',
//           select: 'name created_by',
//           populate: { path: 'created_by', select: 'username email' },
//         });


//       fromInvites = await Team.find()
//         .select('name members created_by')
//         .populate({
//           path: 'members',
//           select: 'username email',
//         })
//         .populate({
//           path: 'created_by',
//           select: 'username email',
//         });
//     } else {
//       // Regular Users: Fetch only their invites
//       const user = await User.findById(userId)
//         .select('invitations invitationToken invitationExpire')
//         .populate({
//           path: 'invitations',
//           select: 'name created_by',
//           populate: { path: 'created_by', select: 'username email' },
//         });

//       if (!user) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//       }

//       toInvites = user.invitations.map((invite) => ({
//         teamId: invite._id,
//         teamName: invite.name,
//         status: invite.status,
//         invitedBy: invite.created_by ? {
//           id: invite.created_by._id,
//           username: invite.created_by.username,
//           email: invite.created_by.email,
//         } : null,
//         inviteToken: user.invitationToken, // Only relevant for users
//         inviteExpires: user.invitationExpire,
//       }));

//       fromInvites = await Team.find({ created_by: userId })
//         .select('name members')
//         .populate({
//           path: 'members',
//           select: 'username email',
//         });
//     }

//     const invites = {
//       to: toInvites,
//       from: fromInvites.map((team) => ({
//         teamId: team._id,
//         teamName: team.name,
//         invitedMembers: team.members.map((member) => ({
//           id: member._id,
//           username: member.username,
//           email: member.email,
//         })),
//       })),
//     };

//     res.status(200).json({ success: true, data: invites });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server Error');
//   }
// };


exports.getAllInvites = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let toInvites = [];
    let fromInvites = {};

    if (role === 'super_admin') {
      // **Super Admin:** Fetch all invitations

      // **To Invites:** All users with an invitationToken
      const allUsersWithInvites = await User.find({ invitationToken: { $exists: true } })
        .select('username email invitationToken invitationExpire invitations')
        .populate({
          path: 'invitations.team',
          select: 'name created_by',
          populate: {
            path: 'created_by',
            select: 'username email',
          },
        });

      // Debugging: Log fetched users
      // console.log('All Users with Invites:', JSON.stringify(allUsersWithInvites, null, 2));

      toInvites = allUsersWithInvites.map(user => ({
        userId: user._id,
        username: user.username,
        email: user.email,
        invitationToken: user.invitationToken,
        invitationExpire: user.invitationExpire,
        invitations: user.invitations.map(invitation => {
          if (!invitation.team) {
            console.warn(`Invitation ${invitation._id} for user ${user._id} has no associated team.`);
            return null; // Or handle as per your requirement
          }
          return {
            invitationId: invitation._id,
            teamId: invitation.team._id,
            teamName: invitation.team.name,
            status: invitation.status,
            invitationToken: invitation.invitationToken, // Updated field name
            invitationExpire: invitation.invitationExpire, // Updated field name
            createdBy: {
              username: invitation.team.created_by.username,
              email: invitation.team.created_by.email,
            },
          };
        }).filter(inv => inv !== null), // Remove null invitations
      }));

      // **From Invites:** All teams with invitationToken and invitationExpire
      const allTeamsWithInvites = await Team.find()
        .select('name invitationToken invitationExpire created_by members')
        .populate({
          path: 'created_by',
          select: 'username email',
        })
        .populate({
          path: 'members',
          select: 'username email',
        });

      // Debugging: Log fetched teams
      // console.log('All Teams with Invites:', JSON.stringify(allTeamsWithInvites, null, 2));

      fromInvites.teamInvites = allTeamsWithInvites.map(team => ({
        teamId: team._id,
        teamName: team.name,
        invitationToken: team.invitationToken,
        invitationExpire: team.invitationExpire,
        createdBy: {
          username: team.created_by.username,
          email: team.created_by.email,
        },
        members: team.members.map(member => ({
          id: member._id,
          username: member.username,
          email: member.email,
        })),
      }));
    } else {
      // **Regular User:** Fetch only invitations relevant to the user

      // **To Invites:** Invitations sent to the current user
      const userWithInvites = await User.findOne({ _id: userId, invitationToken: { $exists: true } })
        .select('username email invitationToken invitationExpire invitations')
        .populate({
          path: 'invitations.team',
          select: 'name created_by',
          populate: {
            path: 'created_by',
            select: 'username email',
          },
        });

      // Debugging: Log fetched user invites
      // console.log('User with Invites:', JSON.stringify(userWithInvites, null, 2));

      if (userWithInvites && userWithInvites.invitations.length > 0) {
        toInvites = userWithInvites.invitations.map(invitation => {
          if (!invitation.team) {
            console.warn(`Invitation ${invitation._id} for user ${userId} has no associated team.`);
            return null; // Or handle as per your requirement
          }
          return {
            invitationId: invitation._id,
            teamId: invitation.team._id,
            teamName: invitation.team.name,
            status: invitation.status,
            invitationToken: invitation.invitationToken, // Updated field name
            invitationExpire: invitation.invitationExpire, // Updated field name
            createdBy: {
              username: invitation.team.created_by.username,
              email: invitation.team.created_by.email,
            },
          };
        }).filter(inv => inv !== null); // Remove null invitations
      }

      // **From Invites:** Teams where the user is a creator or a member
      const userTeams = await Team.find({
        $or: [
          { created_by: userId },
          { members: userId },
        ],
      })
        .select('name invitationToken invitationExpire created_by members')
        .populate({
          path: 'created_by',
          select: 'username email',
        })
        .populate({
          path: 'members',
          select: 'username email',
        });

      // Debugging: Log fetched user teams
      // console.log('User Teams:', JSON.stringify(userTeams, null, 2));

      fromInvites.teamInvites = userTeams.map(team => ({
        teamId: team._id,
        teamName: team.name,
        invitationToken: team.invitationToken,
        invitationExpire: team.invitationExpire,
        createdBy: {
          username: team.created_by.username,
          email: team.created_by.email,
        },
        members: team.members.map(member => ({
          id: member._id,
          username: member.username,
          email: member.email,
        })),
      }));
    }

    // **Construct the Response Object**
    const invites = {
      to: toInvites,
      from: fromInvites,
    };

    res.status(200).json({ success: true, data: invites });
  } catch (error) {
    console.error('Error in getAllInvites:', error.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Accept team invitation
// @route   POST /api/teams/invite/accept/:inviteToken
// @access  Private (User Only)
exports.acceptInvitation = async (req, res) => {
  const { inviteToken } = req.params;

  try {
    const { role, id: userId } = req.user;

    // Restrict accept functionality to users only
    if (role !== 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized to accept invitations' });
    }

    const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

    const user = await User.findOne({
      'invitations.token': hashedToken,
      'invitations.expireAt': { $gt: Date.now() },
      'invitations.status': 'pending',
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
    }

    const team = await Team.findById(user.invitedTeam);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Add user to the team
    team.members.push(user._id);
    await team.save();

    // Add team to user's teams
    user.teams.push(team._id);
    user.invitationToken = undefined;
    user.invitationExpire = undefined;
    user.invitedTeam = undefined;
    invitation.status = 'accepted';
    await user.save();

    res.status(200).json({ success: true, message: 'Invitation accepted and team joined successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Decline a team invitation
// @route   POST /api/teams/invite/decline/:inviteToken
// @access  Private (All Roles)
exports.declineInvitation = async (req, res) => {
  const { inviteToken } = req.params;

  try {
    const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

    const user = await User.findOne({
      'invitations.token': hashedToken,
      'invitations.expireAt': { $gt: Date.now() },
      'invitations.status': 'pending',
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
    }

    // Clear the invitation details
    user.invitationToken = undefined;
    user.invitationExpire = undefined;
    user.invitedTeam = undefined;

    const invitation = user.invitations.find((invite) => invite.token === hashedToken);
    invitation.status = 'declined';

    await user.save();

    res.status(200).json({ success: true, message: 'Invitation declined successfully' });
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
      // Fetch all teams for Admin/Super Admin
      teams = await Team.find()
        .populate('members', 'username email skill per_hour_rate expertise')
        .populate('created_by', 'username email'); // Populate created_by field
    } else {
      // Fetch only teams the user is a member of
      teams = await Team.find({ members: req.user.id })
        .populate('members', 'username email skill per_hour_rate expertise')
        .populate('created_by', 'username email'); // Populate created_by field
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
    await Team.findByIdAndDelete(team._id);


    res.status(200).json({ success: true, message: 'Team removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
};
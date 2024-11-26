// @desc Routes for team invitations
const express = require('express');
const {
  createTeam,
  inviteMember,
  acceptInvitation,
  getTeams,
  getTeamById,
  deleteTeam,
  getAllInvites,
  declineInvitation,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Fetch all invites (to and from based on role)
router.get('/invites', getAllInvites);

// Accept an invitation (User only)
router.post('/invite/accept/:inviteToken', authorizeRoles('user'), acceptInvitation);

// Decline an invitation (All roles)
router.post('/invite/decline/:inviteToken', declineInvitation);


// Other team-related routes
router.post('/', authorizeRoles('admin', 'super_admin'), createTeam);
router.get('/:id', authorizeRoles('admin', 'super_admin', 'user'), getTeamById);
router.delete('/:id', authorizeRoles('admin', 'super_admin'), deleteTeam);
router.post('/:teamId/invite', authorizeRoles('admin', 'super_admin', 'user'), inviteMember);
router.get('/', getTeams);

module.exports = router;

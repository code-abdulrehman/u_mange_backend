const express = require('express');
const { createTeam, inviteMember, acceptInvitation, getTeams } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/teams
router.post('/', authorizeRoles('admin', 'super_admin'), createTeam);

// @route   POST /api/teams/:teamId/invite
router.post('/:teamId/invite', authorizeRoles('admin', 'super_admin'), inviteMember);

// Route to handle accepting invitations (public access)
router.post('/invite/accept/:inviteToken', acceptInvitation);

// @route   GET /api/teams
router.get('/', getTeams);

module.exports = router;

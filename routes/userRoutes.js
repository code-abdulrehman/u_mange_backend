const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getExpertiseList,
  getCountriesList,
  getUserPeerIds,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/users
// For admin/super_admin: Fetch all users
// For regular user: Fetch only team members
router.get('/', getUsers);

// @route   GET /api/users/expertise
router.get('/expertise', authorizeRoles('admin', 'super_admin'), getExpertiseList);

// @route   GET /api/users/countries
router.get('/countries', authorizeRoles('admin', 'super_admin'), getCountriesList);

// @route   GET /api/users/:id
router.get('/:id', authorizeRoles('admin', 'super_admin'), getUser);

// @route   PUT /api/users/:id
router.put('/:id', authorizeRoles('admin', 'super_admin'), updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', authorizeRoles('super_admin'), deleteUser);

// @route   GET /api/users/peerids
router.get('/peerids', authorizeRoles('admin', 'super_admin'), getUserPeerIds);

module.exports = router;

// routes/userRoutes.js

const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, getExpertiseList, getCountriesList , getUserPeerIds} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and require Admin or Super Admin roles
router.use(protect);
router.use(authorizeRoles('admin', 'super_admin'));

// @route   GET /api/users
router.get('/', getUsers);

// @route   GET /api/users/expertise
router.get('/expertise', getExpertiseList);

// @route   GET /api/users/countries
router.get('/countries', getCountriesList);

// @route   GET /api/users/:id
router.get('/:id', getUser);

// @route   PUT /api/users/:id
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', deleteUser);

router.get('/peerids', getUserPeerIds);
module.exports = router;

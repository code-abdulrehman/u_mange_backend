const express = require('express');
const { createTask, updateTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/tasks
router.post('/', authorizeRoles('admin', 'super_admin'), createTask);

// @route   PUT /api/tasks/:id
router.put('/:id', authorizeRoles('admin', 'super_admin', 'user'), updateTask);

// @route   GET /api/tasks
router.get('/', getTasks);

module.exports = router;

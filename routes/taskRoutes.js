// routes/taskRoutes.js

const express = require('express');
const {
  createTask,
  updateTask,
  getTasks,
  getTaskById,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/tasks
router.post('/', authorizeRoles('admin', 'super_admin'), createTask);

// @route   GET /api/tasks/:id
router.get('/:id', authorizeRoles('admin', 'super_admin', 'user'), getTaskById);

// @route   PUT /api/tasks/:id
router.put('/:id', authorizeRoles('admin', 'super_admin', 'user'), updateTask);

// @route   DELETE /api/tasks/:id
router.delete('/:id', authorizeRoles('admin', 'super_admin'), deleteTask);

// @route   GET /api/tasks
router.get('/', getTasks);

module.exports = router;

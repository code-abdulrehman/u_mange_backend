const Task = require('../models/Task');
const Team = require('../models/Team');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User'); 

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Team Lead)
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Team Lead)
exports.createTask = async (req, res) => {
  const { title, description, teamId, assignedTo } = req.body;

  try {
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check if team has reached max tasks
    if (team.tasks.length >= team.max_tasks) {
      return res.status(400).json({ success: false, message: 'Max task limit reached for this team' });
    }

    const task = new Task({
      title,
      description,
      team: teamId,
      assigned_to: assignedTo,
      created_by: req.user.id,
    });

    await task.save();

    // Add task to team
    team.tasks.push(task._id);
    await team.save();

    // Notify assigned user via email
    const user = await User.findById(assignedTo);
    if (user) {
      const message = `Hello ${user.first_name},\n\nYou have been assigned a new task: ${title}.`;

      await sendEmail({
        email: user.email,
        subject: 'New Task Assigned',
        message,
      });

      // Add task to user's tasks array
      user.tasks.push(task._id);
      await user.save();
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Update task status
// @route   PUT /api/tasks/:id
// @access  Private (Assigned User, Admin)
exports.updateTask = async (req, res) => {
  const { status, review } = req.body;

  try {
    let task = await Task.findById(req.params.id).populate('created_by', 'email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only assigned user or admin can update
    if (req.user.role !== 'admin' && task.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    task.status = status || task.status;
    task.review = review || task.review;

    // If reviewed and approved
    if (review === 'approved') {
      task.payment_status = 'approved';
      // Implement payment sending logic here
    }

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private (Admin, Super Admin, Team Members)
exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      tasks = await Task.find().populate('assigned_to', 'username email');
    } else {
      tasks = await Task.find({ assigned_to: req.user.id }).populate('assigned_to', 'username email');
    }

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

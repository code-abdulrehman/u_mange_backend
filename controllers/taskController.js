const Task = require('../models/Task');
const Team = require('../models/Team');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Payment = require('../models/Payment');

// Create Task
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

// Update Task
exports.updateTask = async (req, res) => {
  const { status, review } = req.body;

  try {
    let task = await Task.findById(req.params.id).populate('created_by', 'email role');

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
    if (review === 'approved' && task.payment_status !== 'approved') {
      task.payment_status = 'approved';

      // Fetch task details
      const assignedUser = await User.findById(task.assigned_to);
      const perHourRate = assignedUser.per_hour_rate;

      // Calculate payment
      const paymentAmount = perHourRate; // Adjust based on your logic

      // Fetch current fee percentage
      const settings = await Setting.findOne();
      const feePercentage = settings ? settings.feePercentage : 0.7;
      const fee = parseFloat(((paymentAmount * feePercentage) / 100).toFixed(2));

      // Create payment for the assigned user
      const payment = new Payment({
        user: assignedUser._id,
        amount: paymentAmount,
        fee: fee,
        total_amount: parseFloat((paymentAmount + fee).toFixed(2)),
        status: 'completed',
        processed_by: req.user.id,
      });

      await payment.save();

      // Update user's payment records
      assignedUser.payments.push(payment._id);
      await assignedUser.save();

      const superAdmin = await User.findOne({ role: 'super_admin' }).sort({ createdAt: 1 });

      if (superAdmin) {
        superAdmin.payments.push(payment._id);
        await superAdmin.save();


        await sendEmail({
          email: superAdmin.email,
            subject: 'Task Completion Fee Applied',
            template: 'paymentTemplate.html',
            context: {
              team_name: assignedUser.username, 
              amount: fee,
            },
        });

        await sendEmail({
          email: assignedUser.email,
            subject: 'Task Completion Fee Applied',
            template: 'paymentTemplate.html',
            context: {
              team_name: "", 
              amount: fee,
            },
        });
    }
    }

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get All Tasks
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

// Get Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned_to', 'username email')
      .populate('created_by', 'username email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Admins, Super Admins, or the assigned user can view the task
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin' &&
      task.assigned_to._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Admins, Super Admins, or the user who created the task can delete it
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin' &&
      task.created_by.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    // Remove task from the team's tasks array
    const team = await Team.findById(task.team);
    if (team) {
      team.tasks = team.tasks.filter(taskId => taskId.toString() !== task._id.toString());
      await team.save();
    }

    // Remove task from the assigned user's tasks array
    const user = await User.findById(task.assigned_to);
    if (user) {
      user.tasks = user.tasks.filter(taskId => taskId.toString() !== task._id.toString());
      await user.save();
    }

    // Optionally, delete associated payments if any
    await Payment.deleteMany({ task: task._id });

    // Finally, delete the task
    await task.remove();

    res.status(200).json({ success: true, message: 'Task removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(500).send('Server Error');
  }
};

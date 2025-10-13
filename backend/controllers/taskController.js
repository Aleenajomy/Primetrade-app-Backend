const { validationResult } = require('express-validator');
const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const { search, status } = req.query;
    const tasks = await Task.findByUserId(req.user.id, { search, status });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status = 'pending' } = req.body;
    const task = await Task.create({
      user_id: req.user.id,
      title,
      description,
      status
    });

    res.status(201).json({
      ...task,
      message: 'Task created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status } = req.body;
    const updated = await Task.update(req.params.id, req.user.id, {
      title,
      description,
      status
    });

    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const deleted = await Task.delete(req.params.id, req.user.id, isAdmin);

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
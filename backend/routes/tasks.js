const express = require('express');
const { body } = require('express-validator');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks for user
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in-progress, completed] }
 *     responses:
 *       200: { description: Tasks retrieved }
 */
router.get('/', authenticateToken, getTasks);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in-progress, completed] }
 *     responses:
 *       201: { description: Task created }
 */
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 */
router.put('/:id', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task (User can delete own tasks, Admin can delete any)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;
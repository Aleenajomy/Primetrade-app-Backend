const express = require('express');
const { getAllUsers, deleteUser, getAllTasks, deleteAnyTask } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users retrieved }
 */
router.get('/users', authenticateToken, requireRole(['admin']), getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User deleted }
 */
router.delete('/users/:id', authenticateToken, requireRole(['admin']), deleteUser);

/**
 * @swagger
 * /api/v1/admin/tasks:
 *   get:
 *     summary: Get all tasks from all users (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All tasks retrieved }
 */
router.get('/tasks', authenticateToken, requireRole(['admin']), getAllTasks);

/**
 * @swagger
 * /api/v1/admin/tasks/{id}:
 *   delete:
 *     summary: Delete any task (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete('/tasks/:id', authenticateToken, requireRole(['admin']), deleteAnyTask);

module.exports = router;
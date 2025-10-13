require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000']
    : ['http://localhost:3000']
}));

app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Primetrade API',
      version: '1.0.0',
      description: 'REST API with Authentication & Role-Based Access'
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./server.js']
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Database setup
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create admin user
  setTimeout(async () => {
    db.get('SELECT * FROM users WHERE email = ?', ['admin@primetrade.ai'], async (err, user) => {
      if (!user) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
          ['Admin User', 'admin@primetrade.ai', hashedPassword, 'admin']);
      }
    });
  }, 1000);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [user, admin], default: user }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error }
 */
app.post('/api/v1/register', [
  body('name').trim().isLength({ min: 2 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = 'user' } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
      [name, email, hashedPassword, role], 
      function(err) {
        if (err) {
          return res.status(400).json({ 
            error: err.message.includes('UNIQUE') ? 'Email already exists' : 'Registration failed' 
          });
        }
        const token = jwt.sign({ id: this.lastID, email, role }, JWT_SECRET);
        res.status(201).json({ 
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, name, email, role }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Invalid credentials }
 */
app.post('/api/v1/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile retrieved }
 */
app.get('/api/v1/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    }
  );
});

/**
 * @swagger
 * /api/v1/profile:
 *   put:
 *     summary: Update user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2 }
 *     responses:
 *       200: { description: Profile updated }
 */
app.put('/api/v1/profile', authenticateToken, [
  body('name').trim().isLength({ min: 2 }).escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name } = req.body;
  db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.json({ message: 'Profile updated successfully' });
  });
});

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks for user
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
app.get('/api/v1/tasks', authenticateToken, (req, res) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  let params = [req.user.id];

  if (search) {
    query += ' AND title LIKE ?';
    params.push(`%${search}%`);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(tasks);
  });
});

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
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
app.post('/api/v1/tasks', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status = 'pending' } = req.body;
  db.run('INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description, status],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create task' });
      res.status(201).json({ 
        id: this.lastID, title, description, status,
        message: 'Task created successfully' 
      });
    }
  );
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 */
app.put('/api/v1/tasks/:id', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status } = req.body;
  db.run('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
    [title, description, status, req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update task' });
      if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
      res.json({ message: 'Task updated successfully' });
    }
  );
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task (User can delete own tasks, Admin can delete any)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 */
app.delete('/api/v1/tasks/:id', authenticateToken, (req, res) => {
  const query = req.user.role === 'admin' 
    ? 'DELETE FROM tasks WHERE id = ?'
    : 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
  const params = req.user.role === 'admin' 
    ? [req.params.id]
    : [req.params.id, req.user.id];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete task' });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found or unauthorized' });
    res.json({ message: 'Task deleted successfully' });
  });
});

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users retrieved }
 */
app.get('/api/v1/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(users);
  });
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User deleted }
 */
app.delete('/api/v1/admin/users/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  });
});

/**
 * @swagger
 * /api/v1/admin/tasks:
 *   get:
 *     summary: Get all tasks from all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All tasks retrieved }
 */
app.get('/api/v1/admin/tasks', authenticateToken, requireRole(['admin']), (req, res) => {
  const query = `
    SELECT t.*, u.name as user_name, u.email as user_email 
    FROM tasks t 
    JOIN users u ON t.user_id = u.id 
    ORDER BY t.created_at DESC
  `;
  
  db.all(query, (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(tasks);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});
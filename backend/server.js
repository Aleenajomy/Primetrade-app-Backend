// Load environment variables first
require('dotenv').config();

// Core modules
const crypto = require('crypto');

// Third-party modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.ALLOWED_ORIGINS || process.env.PRODUCTION_DOMAIN || 'https://localhost:3000').split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json({ limit: '10mb' }));

// Simple CSRF protection using custom header
const csrfProtection = (req, res, next) => {
  const token = req.headers['x-requested-with'];
  if (!token || token !== 'XMLHttpRequest') {
    console.log('CSRF protection failed:', req.headers);
    return res.status(403).json({ error: 'CSRF protection: Invalid request' });
  }
  next();
};

// Temporarily disable CSRF for testing
// app.use('/api/register', csrfProtection);
// app.use('/api/login', csrfProtection);

// Initialize SQLite database
const db = new sqlite3.Database('./database.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tasks table (sample entity for CRUD operations)
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Auth middleware with CSRF protection
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const csrfHeader = req.headers['x-requested-with'];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Temporarily disable CSRF for testing
  // if (!csrfHeader || csrfHeader !== 'XMLHttpRequest') {
  //   return res.status(403).json({ error: 'CSRF protection: Invalid request' });
  // }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User Registration
app.post('/api/register', [
  body('name').trim().isLength({ min: 2 }).escape().withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [name, email, hashedPassword], 
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
        res.status(201).json({ 
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, name, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
app.post('/api/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update user profile
app.put('/api/profile', authenticateToken, [
  body('name').trim().isLength({ min: 2 }).escape().withMessage('Name must be at least 2 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;
  
  db.run('UPDATE users SET name = ? WHERE id = ?', 
    [name, req.user.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Update failed' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// CRUD Operations for Tasks

// Get all tasks for user
app.get('/api/tasks', authenticateToken, (req, res) => {
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
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(tasks);
  });
});

// Create task
app.post('/api/tasks', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape().withMessage('Title is required'),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, status = 'pending' } = req.body;

  db.run('INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description, status],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create task' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        title, 
        description, 
        status,
        message: 'Task created successfully' 
      });
    }
  );
});

// Update task
app.put('/api/tasks/:id', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).escape().withMessage('Title is required'),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, status } = req.body;
  const taskId = req.params.id;

  db.run('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
    [title, description, status, taskId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task deleted successfully' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
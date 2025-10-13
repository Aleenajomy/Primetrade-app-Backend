const database = require('../config/database');

class Task {
  static async create(taskData) {
    const { user_id, title, description, status = 'pending' } = taskData;
    
    return new Promise((resolve, reject) => {
      database.getDb().run(
        'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
        [user_id, title, description, status],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, title, description, status });
        }
      );
    });
  }

  static async findByUserId(userId, filters = {}) {
    const { search, status } = filters;
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    let params = [userId];

    if (search) {
      query += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      database.getDb().all(query, params, (err, tasks) => {
        if (err) reject(err);
        else resolve(tasks);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      database.getDb().get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
        if (err) reject(err);
        else resolve(task);
      });
    });
  }

  static async update(id, userId, taskData) {
    const { title, description, status } = taskData;
    
    return new Promise((resolve, reject) => {
      database.getDb().run(
        'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
        [title, description, status, id, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static async delete(id, userId = null, isAdmin = false) {
    const query = isAdmin ? 'DELETE FROM tasks WHERE id = ?' : 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    const params = isAdmin ? [id] : [id, userId];

    return new Promise((resolve, reject) => {
      database.getDb().run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  static async getAll() {
    const query = `
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      database.getDb().all(query, (err, tasks) => {
        if (err) reject(err);
        else resolve(tasks);
      });
    });
  }
}

module.exports = Task;
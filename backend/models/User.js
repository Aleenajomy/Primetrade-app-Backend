const bcrypt = require('bcryptjs');
const database = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      database.getDb().run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, email, role });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      database.getDb().get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      database.getDb().get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
  }

  static async updateProfile(id, name) {
    return new Promise((resolve, reject) => {
      database.getDb().run('UPDATE users SET name = ? WHERE id = ?', [name, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      database.getDb().all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) reject(err);
        else resolve(users);
      });
    });
  }

  static async deleteById(id) {
    return new Promise((resolve, reject) => {
      database.getDb().run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }
}

module.exports = User;
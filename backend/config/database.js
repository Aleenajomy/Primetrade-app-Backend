const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.db = new sqlite3.Database('./database.db');
    this.init();
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS tasks (
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
        this.db.get('SELECT * FROM users WHERE email = ?', ['admin@primetrade.ai'], async (err, user) => {
          if (!user) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            this.db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
              ['Admin User', 'admin@primetrade.ai', hashedPassword, 'admin']);
          }
        });
      }, 1000);
    });
  }

  getDb() {
    return this.db;
  }
}

module.exports = new Database();
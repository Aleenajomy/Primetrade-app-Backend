# Primetrade.ai Backend Developer Assignment

**Scalable REST API with Authentication & Role-Based Access**

Built with Node.js backend and React.js frontend, completed within 3 days.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm

### Installation

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and set JWT_SECRET
   npm start
   ```
   Server runs on http://localhost:5000

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on http://localhost:3000

### Default Admin Account
- Email: `admin@primetrade.ai`
- Password: `admin123`

## 📡 API Endpoints

### Authentication (`/api/v1/`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get profile (protected)
- `PUT /profile` - Update profile (protected)

### Tasks CRUD (`/api/v1/tasks/`)
- `GET /tasks` - Get user tasks with search/filter (protected)
- `POST /tasks` - Create task (protected)
- `PUT /tasks/:id` - Update task (protected)
- `DELETE /tasks/:id` - Delete task (admin only)

### Admin (`/api/v1/admin/`)
- `GET /admin/users` - Get all users (admin only)
- `DELETE /admin/users/:id` - Delete user (admin only)
- `GET /admin/tasks` - Get all tasks (admin only)

## 📚 API Documentation
Interactive Swagger UI: http://localhost:5000/api-docs

## 🗄️ Database Schema

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, SQLite, JWT, bcrypt, Swagger
**Frontend:** React.js, React Router, Axios, TailwindCSS

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting (100 req/15min)
- Security headers with Helmet.js

## ✅ Assignment Requirements Met

- [x] User Registration & Login APIs with JWT
- [x] Role-Based Access (User/Admin roles)
- [x] CRUD APIs for Tasks entity
- [x] API Versioning (`/v1/`)
- [x] Error Handling & Validation
- [x] Swagger API Documentation
- [x] SQLite Database with normalized schema
- [x] React.js Frontend with authentication
- [x] Security implementation
- [x] Scalable architecture

## 👨💻 Developer
**Aleena Jomy** - Primetrade.ai Backend Developer (Intern) Assignment
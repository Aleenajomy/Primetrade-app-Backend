# Primetrade Task Management System

A full-stack web application built with Node.js/Express backend and React.js frontend, featuring JWT authentication and CRUD operations for task management.

## 🚀 Features

- **Authentication System**: User registration and login with JWT tokens
- **Task Management**: Complete CRUD operations for tasks
- **User Profiles**: View and update user information
- **Security**: Rate limiting, input validation, and CORS protection
- **Responsive UI**: Modern React.js frontend with Tailwind CSS
- **API Documentation**: Comprehensive API docs and Postman collection

## 📁 Project Structure

```
primetrade-app-Backend/
├── backend/                 # Node.js/Express API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment variables template
│   └── database.db         # SQLite database
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js         # Main app component
│   └── package.json       # Frontend dependencies
├── docs/                  # Documentation
│   ├── API_Documentation.md
│   ├── Primetrade_API.postman_collection.json
│   └── swagger.yaml       # OpenAPI specification
└── README.md             # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Icons** - Icon library

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Aleenajomy/Primetrade-app-Backend.git
cd primetrade-app-Backend
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# JWT_SECRET=your-secret-key-here
# PORT=5000

# Start the backend server
npm start

# For development with auto-reload
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Production Domain (for deployment)
PRODUCTION_DOMAIN=https://yourdomain.com
```

## 📚 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### User Profile
- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)

### Task Management
- `GET /api/tasks` - Get all user tasks (protected)
- `POST /api/tasks` - Create new task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

For detailed API documentation, see [API_Documentation.md](./docs/API_Documentation.md)

## 🧪 Testing the API

### Demo Credentials

**Regular User:**
- Email: `jack@gmail.com`
- Password: `jack@123`

**Admin User:**
- Email: `admin@gmail.com`
- Password: `123`

### Using Postman
1. Import the collection: `docs/Primetrade_API.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:5000/api`
3. Use demo credentials above or register a new user
4. The token will be automatically set for protected endpoints

### Using cURL

```bash
# Register a user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get tasks (replace TOKEN with actual JWT token)
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer TOKEN"
```

## 🎨 Frontend Usage

1. **Registration**: Create a new account at `/register`
2. **Login**: Sign in at `/login`
3. **Dashboard**: View and manage tasks at `/dashboard`
4. **Profile**: Update user information

### Key Features
- Responsive design for mobile and desktop
- Real-time form validation
- Protected routes with authentication
- Task filtering and search
- Modern UI with Tailwind CSS

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1. **Environment Variables**: Set all required env vars in your hosting platform
2. **Database**: SQLite file will be created automatically
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

### Frontend Deployment (Netlify/Vercel)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `build`
3. **Environment Variables**: Set API base URL

### GitHub Pages (Current Setup)

The frontend is configured for GitHub Pages deployment:

```bash
cd frontend
npm run deploy
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Server-side validation and sanitization
- **CORS Protection** - Configured allowed origins
- **Helmet.js** - Security headers
- **SQL Injection Prevention** - Parameterized queries

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
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

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm start    # Starts development server with hot reload
```

### Code Structure

- **Backend**: RESTful API with Express.js
- **Frontend**: Component-based React architecture
- **Authentication**: JWT tokens with context API
- **Styling**: Tailwind CSS utility classes
- **State Management**: React hooks and context

## 📈 Scalability

See [SCALABILITY.md](./SCALABILITY.md) for detailed information on scaling this application.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔗 Links

- [API Documentation](./docs/API_Documentation.md)
- [Postman Collection](./docs/Primetrade_API.postman_collection.json)
- [Live Demo](https://aleenajomy.github.io/Primetrade-app-Backend)
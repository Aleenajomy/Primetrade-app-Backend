# Primetrade.ai API Documentation

## Base URL
```
Local Development: http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "message": "Success message",
  "data": {}, // Response data
  "error": "Error message (if any)"
}
```

---

## 🔐 Authentication Endpoints

### 1. User Registration
**POST** `/api/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules:**
- `name`: Required, minimum 2 characters
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

---

### 2. User Login
**POST** `/api/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 👤 User Profile Endpoints

### 3. Get User Profile
**GET** `/api/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Update User Profile
**PUT** `/api/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully"
}
```

---

## 📋 Task Management Endpoints

### 5. Get All Tasks
**GET** `/api/tasks`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `search` (optional): Search tasks by title
- `status` (optional): Filter by status (`pending`, `in-progress`, `completed`)

**Example:**
```
GET /api/tasks?search=meeting&status=pending
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Team Meeting",
    "description": "Weekly team sync meeting",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "title": "Code Review",
    "description": "Review pull requests",
    "status": "in-progress",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
]
```

---

### 6. Create New Task
**POST** `/api/tasks`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "pending"
}
```

**Response (201):**
```json
{
  "id": 3,
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "message": "Task created successfully"
}
```

**Validation Rules:**
- `title`: Required, minimum 1 character
- `description`: Optional
- `status`: Optional, must be one of: `pending`, `in-progress`, `completed`

---

### 7. Update Task
**PUT** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "completed"
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

---

### 8. Delete Task
**DELETE** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

---

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Invalid token |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## 📝 Example Usage

### JavaScript (Axios)
```javascript
// Login
const loginResponse = await axios.post('http://localhost:5000/api/login', {
  email: 'john@example.com',
  password: 'password123'
});

const token = loginResponse.data.token;

// Get tasks with authentication
const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create new task
const newTask = await axios.post('http://localhost:5000/api/tasks', {
  title: 'New Task',
  description: 'Task description',
  status: 'pending'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL Examples
```bash
# Register user
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

# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","description":"Task description","status":"pending"}'
```

---

## 🔒 Security Notes

1. **JWT Tokens**: Tokens expire and should be refreshed periodically
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: API has rate limiting (100 requests per 15 minutes)
4. **Input Validation**: All inputs are validated and sanitized
5. **CORS**: CORS is configured for specific origins

---

## 📊 Rate Limits

- **General**: 100 requests per 15 minutes per IP
- **Authentication**: No additional limits
- **Task Operations**: No additional limits

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```
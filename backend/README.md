# Mellon Harmony Backend API

A RESTful API built with Go, Gin, GORM, and PostgreSQL for the Mellon Harmony issue tracking system.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (user, admin, team_lead)
- **User Management**: CRUD operations for users
- **Issue Tracking**: Full issue lifecycle management with status and priority
- **Comments**: Threaded comments on issues
- **Projects**: Project management with member assignment
- **PostgreSQL**: Robust database with GORM ORM

## Tech Stack

- **Go 1.21+**: Programming language
- **Gin**: HTTP web framework
- **GORM**: ORM for database operations
- **PostgreSQL**: Database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

## Project Structure

```
backend/
├── main.go                 # Application entry point
├── go.mod                  # Go dependencies
├── internal/
│   ├── config/            # Configuration management
│   ├── database/          # Database connection and migrations
│   ├── models/            # Data models
│   ├── repository/        # Data access layer
│   ├── service/           # Business logic layer
│   ├── handlers/          # HTTP handlers
│   └── middleware/        # Middleware (auth, etc.)
└── Dockerfile             # Docker configuration
```

## Setup

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 12 or higher
- Make sure PostgreSQL is running

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mellon_harmony?sslmode=disable
JWT_SECRET=your-secret-key-change-in-production
```

5. Run the application:
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register new user
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/logout` - Logout (protected)

### Users
- `GET /api/v1/users` - Get all users (protected)
- `GET /api/v1/users/:id` - Get user by ID (protected)
- `PUT /api/v1/users/:id` - Update user (protected)
- `DELETE /api/v1/users/:id` - Delete user (protected)

### Issues
- `GET /api/v1/issues` - Get all issues (protected, supports query params: status, priority, assigned_to, project_id)
- `GET /api/v1/issues/:id` - Get issue by ID (protected)
- `POST /api/v1/issues` - Create issue (protected)
- `PUT /api/v1/issues/:id` - Update issue (protected)
- `PATCH /api/v1/issues/:id/status` - Update issue status (protected)
- `DELETE /api/v1/issues/:id` - Delete issue (protected)

### Comments
- `GET /api/v1/issues/:issueId/comments` - Get comments for an issue (protected)
- `POST /api/v1/issues/:issueId/comments` - Create comment (protected)
- `PUT /api/v1/comments/:id` - Update comment (protected)
- `DELETE /api/v1/comments/:id` - Delete comment (protected)

### Projects
- `GET /api/v1/projects` - Get all projects (protected)
- `GET /api/v1/projects/:id` - Get project by ID (protected)
- `POST /api/v1/projects` - Create project (protected)
- `PUT /api/v1/projects/:id` - Update project (protected)
- `DELETE /api/v1/projects/:id` - Delete project (protected)
- `POST /api/v1/projects/:id/members` - Add project member (protected)
- `DELETE /api/v1/projects/:id/members/:userId` - Remove project member (protected)

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Database Models

### User
- id (UUID)
- name (string)
- email (string, unique)
- password (hashed)
- role (user | admin | team_lead)
- avatar (optional string)

### Issue
- id (UUID)
- title (string)
- description (text)
- status (todo | in-progress | review | done)
- priority (low | medium | high)
- assigned_to (UUID, optional)
- created_by (UUID)
- project_id (UUID, optional)

### Comment
- id (UUID)
- issue_id (UUID)
- user_id (UUID)
- text (text)
- created_at (timestamp)

### Project
- id (UUID)
- name (string)
- description (text)
- progress (int, 0-100)
- status (planning | En Progreso | Finalizando | completed | on_hold)
- deadline (timestamp, optional)
- color (string)
- created_by (UUID)

### ProjectMember
- id (UUID)
- project_id (UUID)
- user_id (UUID)
- role (string)

## Running with Docker

See the main project README for Docker Compose instructions.

## Development

### Running Tests
```bash
go test ./...
```

### Building
```bash
go build -o mellon-api main.go
```

## License

MIT

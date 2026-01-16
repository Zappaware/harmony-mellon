# Mellon Harmony - Full Stack Application

A complete issue tracking system with a Next.js frontend and Go backend API.

## Project Structure

```
mellon-harmony/
├── app/                    # Next.js frontend pages
├── src/                    # Next.js source code
├── backend/                # Go backend API
│   ├── internal/
│   │   ├── config/        # Configuration
│   │   ├── database/      # Database setup
│   │   ├── models/        # Data models
│   │   ├── repository/    # Data access layer
│   │   ├── service/       # Business logic
│   │   ├── handlers/      # HTTP handlers
│   │   └── middleware/    # Middleware
│   ├── main.go            # Entry point
│   └── Dockerfile         # Backend Dockerfile
├── scripts/               # Utility scripts
│   ├── run-dev.sh        # Run development servers
│   └── run-docker.sh     # Run with Docker
├── docker-compose.yml     # Docker Compose configuration
└── Dockerfile            # Frontend Dockerfile
```

## Quick Start

### Option 1: Development Mode (Recommended for Development)

1. **Prerequisites:**
   - Node.js 20+
   - Go 1.21+
   - PostgreSQL 12+ (or use Docker)

2. **Setup Backend:**
   ```bash
   cd backend
   go mod download
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup Frontend:**
   ```bash
   npm install
   ```

4. **Start PostgreSQL** (if not using Docker):
   ```bash
   # Using Docker
   docker run -d \
     --name mellon-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=mellon_harmony \
     -p 5432:5432 \
     postgres:16-alpine
   ```

5. **Run Development Servers:**
   ```bash
   ./scripts/run-dev.sh
   ```

   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   go run main.go

   # Terminal 2 - Frontend
   npm run dev
   ```

### Option 2: Docker Compose (Recommended for Production/Testing)

1. **Start all services:**
   ```bash
   ./scripts/run-docker.sh
   ```

   Or manually:
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432

3. **Stop services:**
   ```bash
   docker-compose down
   ```

## API Documentation

### Base URL
- Development: `http://localhost:8080/api/v1`
- Production: Configure via environment variables

### Authentication

All protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

### Example API Calls

**Register:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Issues:**
```bash
curl -X GET http://localhost:8080/api/v1/issues \
  -H "Authorization: Bearer <token>"
```

**Create Issue:**
```bash
curl -X POST http://localhost:8080/api/v1/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Issue",
    "description": "Issue description",
    "priority": "high",
    "status": "todo"
  }'
```

## Environment Variables

### Backend (.env)
```
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mellon_harmony?sslmode=disable
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts with roles (user, admin, team_lead)
- `issues` - Issue tracking
- `comments` - Comments on issues
- `projects` - Project management
- `project_members` - Project membership

Migrations run automatically on application start.

## User Roles

- **user**: Regular user, can create and manage their own issues
- **admin**: Full access to all features
- **team_lead**: Can manage team members and projects

## Development

### Backend Development
```bash
cd backend
go run main.go
```

### Frontend Development
```bash
npm run dev
```

### Running Tests
```bash
# Backend
cd backend
go test ./...

# Frontend
npm test
```

## Production Deployment

1. **Build Docker images:**
   ```bash
   docker-compose build
   ```

2. **Set environment variables:**
   - Update `docker-compose.yml` with production values
   - Set strong `JWT_SECRET`
   - Configure production database URL

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check port 8080 is not in use

### Frontend won't connect to backend
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check CORS settings in backend
- Ensure backend is running

### Database connection errors
- Verify PostgreSQL is accessible
- Check database credentials
- Ensure database `mellon_harmony` exists

## License

MIT

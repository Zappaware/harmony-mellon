#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Navigate to project root (one level up from scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT" || {
    echo -e "${YELLOW}Error: Could not navigate to project root${NC}"
    exit 1
}

echo -e "${BLUE}Starting Mellon Harmony Development Environment...${NC}"
echo -e "${BLUE}Project root: ${PROJECT_ROOT}${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}PostgreSQL is not running. Starting with Docker...${NC}"
    docker run -d \
        --name mellon-postgres-dev \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=mellon_harmony \
        -p 5432:5432 \
        postgres:16-alpine
    
    echo -e "${GREEN}Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
fi

# Start backend in background
echo -e "${BLUE}Starting Backend API...${NC}"
if [ ! -d "backend" ]; then
    echo -e "${YELLOW}Error: backend directory not found in ${PROJECT_ROOT}${NC}"
    exit 1
fi

cd backend || {
    echo -e "${YELLOW}Error: Could not navigate to backend directory${NC}"
    exit 1
}

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env file from .env.example${NC}"
    else
        echo -e "${YELLOW}Creating .env file with default values...${NC}"
        cat > .env << EOF
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mellon_harmony?sslmode=disable
JWT_SECRET=test-secret-key-for-development-only-change-in-production
EOF
    fi
fi

# Run backend in background
go run main.go &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}Starting Frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Development servers are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend API: ${BLUE}http://localhost:8080${NC}"
echo -e "Frontend:   ${BLUE}http://localhost:3000${NC}"
echo -e "PostgreSQL: ${BLUE}localhost:5432${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for processes
wait

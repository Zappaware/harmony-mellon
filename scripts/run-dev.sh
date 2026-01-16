#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Mellon Harmony Development Environment...${NC}"

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
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Created .env file from .env.example${NC}"
fi

# Run backend in background
go run main.go &
BACKEND_PID=$!
cd ..

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

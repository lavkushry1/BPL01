#!/bin/bash
# run-dev.sh - Development launcher for Eventia ticketing platform
# This script starts both the backend and frontend in development mode

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/lavkushkumar/Desktop/BPL1"
BACKEND_DIR="$BASE_DIR/eventia-backend-express"
FRONTEND_DIR="$BASE_DIR/eventia-ticketing-flow1"

# Function to print colored section headers
print_section() {
  echo -e "\n${BLUE}=======================================${NC}"
  echo -e "${BLUE}= $1${NC}"
  echo -e "${BLUE}=======================================${NC}\n"
}

# Function to print error message and exit
print_error() {
  echo -e "${RED}✗ ERROR: $1${NC}"
  exit 1
}

# Function to print info message
print_info() {
  echo -e "${CYAN}i $1${NC}"
}

# Check if directory exists
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  print_error "Required project directories not found. Please make sure you're running this script from the correct location."
fi

# Check if .env files exist, if not, suggest running setup-env.sh
if [ ! -f "$BACKEND_DIR/.env" ] || [ ! -f "$FRONTEND_DIR/.env" ]; then
  print_error "Environment files not found. Please run ./setup-env.sh first."
fi

# Variables for child process PIDs
BACKEND_PID=""
FRONTEND_PID=""

# Function to clean up child processes when script is terminated
cleanup() {
  print_section "Shutting down servers"
  
  if [ ! -z "$BACKEND_PID" ]; then
    print_info "Stopping backend server (PID: $BACKEND_PID)..."
    kill -TERM $BACKEND_PID 2>/dev/null || kill -KILL $BACKEND_PID 2>/dev/null
  fi
  
  if [ ! -z "$FRONTEND_PID" ]; then
    print_info "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill -TERM $FRONTEND_PID 2>/dev/null || kill -KILL $FRONTEND_PID 2>/dev/null
  fi
  
  # Wait for processes to terminate
  wait 2>/dev/null
  
  print_info "All servers stopped. Goodbye!"
  exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Function to prefix each line of output with a colored tag
prefix_output() {
  local prefix=$1
  local color=$2
  
  # Read input line by line and prefix each line
  while IFS= read -r line; do
    echo -e "${color}[${prefix}]${NC} $line"
  done
}

print_section "Starting Development Environment"

# Start backend server
print_info "Starting backend server..."
cd "$BACKEND_DIR" || print_error "Failed to navigate to backend directory"

# Start the backend in the background and redirect output to our prefix function
(npm run dev 2>&1 | prefix_output "Backend" "${MAGENTA}") &
BACKEND_PID=$!

# Check if backend started successfully
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  print_error "Failed to start backend server"
fi

print_info "Backend server started with PID: $BACKEND_PID"

# Start frontend server
print_info "Starting frontend server..."
cd "$FRONTEND_DIR" || print_error "Failed to navigate to frontend directory"

# Start the frontend in the background and redirect output to our prefix function
(npm run dev 2>&1 | prefix_output "Frontend" "${GREEN}") &
FRONTEND_PID=$!

# Check if frontend started successfully
sleep 2
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  print_error "Failed to start frontend server"
fi

print_info "Frontend server started with PID: $FRONTEND_PID"

# Open the application in the default browser after a short delay
print_info "Opening application in browser..."

# Different commands for different operating systems
sleep 5 # Give the servers some time to initialize
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:8080
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux with xdg-open
  xdg-open http://localhost:8080 &>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start http://localhost:8080
else
  print_info "Could not open browser automatically. Please open http://localhost:8080 in your browser."
fi

print_section "Development Environment Running"
print_info "Backend server is running at: http://localhost:4000"
print_info "Frontend server is running at: http://localhost:8080"
print_info "Press Ctrl+C to stop both servers"

# Wait for any child process to exit
wait 
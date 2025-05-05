#!/bin/bash
# run-prod.sh - Production run script for Eventia ticketing platform
# This script starts both the backend and frontend in production mode

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

# Function to print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message and exit
print_error() {
  echo -e "${RED}✗ ERROR: $1${NC}"
  exit 1
}

# Function to print warning message
print_warning() {
  echo -e "${YELLOW}! WARNING: $1${NC}"
}

# Function to print info message
print_info() {
  echo -e "${CYAN}i $1${NC}"
}

# Variables for child process PIDs
BACKEND_PID=""
FRONTEND_PID=""
FRONTEND_PORT=3000  # Default port for serving frontend

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

# Check if serve package is installed for frontend static serving
check_serve_installed() {
  if ! npm list -g serve &> /dev/null; then
    print_warning "The 'serve' package is not installed globally. Installing now..."
    npm install -g serve || print_error "Failed to install 'serve'. Try running: npm install -g serve"
  fi
}

# Function to restart a service if it fails
restart_service() {
  local service_type=$1
  local service_command=$2
  local output_prefix=$3
  local output_color=$4
  local max_restarts=3
  local restart_delay=5
  local restarts=0
  
  while [ $restarts -lt $max_restarts ]; do
    print_info "Starting $service_type service (attempt $((restarts+1))/$max_restarts)..."
    
    # Start the service and capture PID
    ($service_command 2>&1 | prefix_output "$output_prefix" "$output_color") &
    local service_pid=$!
    
    # Wait for the service to exit
    wait $service_pid 2>/dev/null
    local exit_code=$?
    
    # Check if the service exited abnormally
    if [ $exit_code -ne 0 ]; then
      restarts=$((restarts+1))
      print_warning "$service_type service terminated with exit code $exit_code. Restarting in $restart_delay seconds..."
      sleep $restart_delay
    else
      # Service exited normally
      print_info "$service_type service terminated normally."
      break
    fi
  done
  
  if [ $restarts -eq $max_restarts ]; then
    print_error "$service_type service failed to start after $max_restarts attempts."
  fi
}

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  print_error "Required project directories not found. Please make sure you're running this script from the correct location."
fi

# Check if production builds exist
if [ ! -d "$BACKEND_DIR/dist" ]; then
  print_error "Backend production build not found. Please run ./build-prod.sh first."
fi

if [ ! -d "$FRONTEND_DIR/dist" ]; then
  print_error "Frontend production build not found. Please run ./build-prod.sh first."
fi

# Check if .env.production files exist
if [ ! -f "$BACKEND_DIR/.env.production" ]; then
  print_warning "Backend .env.production file not found. Using .env file if available."
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error "No environment file found for backend. Please run ./build-prod.sh first."
  fi
fi

print_section "Starting Production Environment"

# Start backend server
print_info "Starting backend server in production mode..."
cd "$BACKEND_DIR" || print_error "Failed to navigate to backend directory"

# Set NODE_ENV for the backend
export NODE_ENV=production

# Use .env.production if available, otherwise use .env
if [ -f .env.production ]; then
  print_info "Using .env.production for backend"
  cp .env.production .env.current
else
  print_info "Using .env for backend"
  cp .env .env.current
fi

# Ensure NODE_ENV is set to production in the env file
sed -i.bak 's/NODE_ENV=.*/NODE_ENV=production/g' .env.current
rm -f .env.current.bak  # Clean up backup file

# Start the backend and capture the PID
# Try using npm run start:prod first, if not available, fall back to npm run start
if grep -q "\"start:prod\"" package.json; then
  print_info "Using npm run start:prod command..."
  (NODE_ENV=production npm run start:prod 2>&1 | prefix_output "Backend" "${MAGENTA}") &
  BACKEND_PID=$!
else
  print_info "Using npm run start command..."
  (NODE_ENV=production npm run start 2>&1 | prefix_output "Backend" "${MAGENTA}") &
  BACKEND_PID=$!
fi

# Give backend time to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  print_error "Backend failed to start. Check logs for errors."
else
  print_success "Backend is running with PID: $BACKEND_PID"
fi

# Start frontend server (static file serving)
print_info "Starting frontend static server..."
cd "$FRONTEND_DIR" || print_error "Failed to navigate to frontend directory"

# Check if serve is installed
check_serve_installed

# Start the frontend and capture the PID
print_info "Serving frontend static files on port $FRONTEND_PORT..."
(npx serve -s dist -l $FRONTEND_PORT 2>&1 | prefix_output "Frontend" "${GREEN}") &
FRONTEND_PID=$!

# Give frontend time to start
sleep 2

# Check if frontend is still running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  print_error "Frontend server failed to start. Check logs for errors."
else
  print_success "Frontend server is running with PID: $FRONTEND_PID"
fi

print_section "Production Environment Running"
print_info "Backend server is running at: http://localhost:5001"
print_info "Frontend server is running at: http://localhost:$FRONTEND_PORT"
print_info "Press Ctrl+C to stop both servers"

# Set up automatic restart for both services
restart_on_failure() {
  # Monitor the backend process
  while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
      print_warning "Backend server has stopped unexpectedly. Restarting..."
      
      cd "$BACKEND_DIR" || print_error "Failed to navigate to backend directory"
      
      # Restart the backend
      if grep -q "\"start:prod\"" package.json; then
        (NODE_ENV=production npm run start:prod 2>&1 | prefix_output "Backend" "${MAGENTA}") &
        BACKEND_PID=$!
      else
        (NODE_ENV=production npm run start 2>&1 | prefix_output "Backend" "${MAGENTA}") &
        BACKEND_PID=$!
      fi
      
      print_info "Backend restarted with PID: $BACKEND_PID"
    fi
    
    # Monitor the frontend process
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
      print_warning "Frontend server has stopped unexpectedly. Restarting..."
      
      cd "$FRONTEND_DIR" || print_error "Failed to navigate to frontend directory"
      
      # Restart the frontend
      (npx serve -s dist -l $FRONTEND_PORT 2>&1 | prefix_output "Frontend" "${GREEN}") &
      FRONTEND_PID=$!
      
      print_info "Frontend restarted with PID: $FRONTEND_PID"
    fi
    
    # Check every 5 seconds
    sleep 5
  done
}

# Start the restart monitor in the background
restart_on_failure &
MONITOR_PID=$!

# Wait for any child process to exit
wait 
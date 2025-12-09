#!/bin/bash
# setup-env.sh - Environment setup script for Eventia ticketing platform
# This script sets up the development environment for both frontend and backend projects

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

# Check if directory exists
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  print_error "Required project directories not found. Please make sure you're running this script from the correct location."
fi

print_section "Checking Prerequisites"

# Check for Node.js
if ! command -v node &> /dev/null; then
  print_warning "Node.js is not installed. Installing now..."
  
  # Check OS and install Node.js accordingly
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use Homebrew if available, otherwise suggest manual install
    if command -v brew &> /dev/null; then
      print_info "Installing Node.js via Homebrew..."
      brew install node || print_error "Failed to install Node.js. Please install it manually."
    else
      print_error "Homebrew not found. Please install Node.js manually from https://nodejs.org (version 16 or higher)."
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - use apt or suggest manual install
    if command -v apt &> /dev/null; then
      print_info "Installing Node.js via apt..."
      curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
      sudo apt-get install -y nodejs || print_error "Failed to install Node.js. Please install it manually."
    else
      print_error "Automatic installation not available. Please install Node.js manually (version 16 or higher)."
    fi
  else
    print_error "Unsupported operating system. Please install Node.js manually (version 16 or higher)."
  fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
  print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
else
  print_success "Node.js version $NODE_VERSION detected"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed. Please install it manually."
else
  print_success "npm detected"
fi

# Check for database (assuming PostgreSQL)
if ! command -v psql &> /dev/null; then
  print_warning "PostgreSQL is not installed. You may need it for local development."
  print_info "Continuing setup without PostgreSQL..."
else
  print_success "PostgreSQL detected"
fi

print_section "Setting up Backend Environment"

# Navigate to backend directory
cd "$BACKEND_DIR" || print_error "Failed to navigate to backend directory"

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
  else
    print_warning ".env.example not found. Creating a basic .env file..."
    
    # Create basic .env file
    cat > .env << EOL
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventia?schema=public"

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=eventia_dev_jwt_secret
JWT_EXPIRES_IN=1d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Redis
REDIS_URL=redis://localhost:6379

# Sentry (Optional)
# SENTRY_DSN=

# Email (Optional)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# EMAIL_FROM=noreply@eventia.com
EOL
    print_info "Basic .env file created. Please update with your actual credentials."
  fi
else
  print_success ".env file already exists"
fi

# Install dependencies
print_info "Installing backend dependencies... (this may take a while)"
npm install || print_error "Failed to install backend dependencies"
print_success "Backend dependencies installed"

# Run Prisma migrations
print_info "Setting up database with Prisma..."
if [ -d "prisma" ]; then
  npx prisma generate || print_error "Failed to generate Prisma client"
  
  # Check if we have a PostgreSQL connection before running migrations
  if command -v psql &> /dev/null; then
    print_info "Running Prisma migrations..."
    npx prisma migrate dev --name init || print_warning "Prisma migrations failed. You may need to set up your database manually."
  else
    print_warning "Skipping Prisma migrations as PostgreSQL is not installed."
    print_info "You'll need to run 'npx prisma migrate dev' manually after setting up your database."
  fi
else
  print_warning "Prisma directory not found. Skipping database migrations."
fi

print_section "Setting up Frontend Environment"

# Navigate to frontend directory
cd "$FRONTEND_DIR" || print_error "Failed to navigate to frontend directory"

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
  else
    print_warning ".env.example not found. Creating a basic .env file..."
    
    # Create basic .env file
    cat > .env << EOL
# API Configuration
VITE_API_URL=http://localhost:4000/api/v1
VITE_WS_URL=ws://localhost:4000

# Application settings
VITE_APP_VERSION=1.0.0
VITE_RELEASE_ID=development

# Analytics & Monitoring (Optional)
# VITE_SENTRY_DSN=

# Payment Gateway
VITE_PAYMENT_GATEWAY_PUBLIC_KEY=pk_test_your_stripe_test_key
EOL
    print_info "Basic .env file created. Please update with your actual credentials."
  fi
else
  print_success ".env file already exists"
fi

# Install dependencies
print_info "Installing frontend dependencies... (this may take a while)"
npm install || print_error "Failed to install frontend dependencies"
print_success "Frontend dependencies installed"

print_section "Environment Setup Complete!"

print_info "To start the development environment, run:"
echo -e "${MAGENTA}./run-dev.sh${NC}"

print_info "To build for production, run:"
echo -e "${MAGENTA}./build-prod.sh${NC}"

print_info "To start the production environment, run:"
echo -e "${MAGENTA}./run-prod.sh${NC}"

print_info "For any issues, please check the README files in each project directory." 
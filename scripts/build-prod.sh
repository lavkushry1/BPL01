#!/bin/bash
# build-prod.sh - Production build script for Eventia ticketing platform
# This script creates optimized production builds for frontend and backend

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

# Generate a timestamp for the build
BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S)
GIT_HASH=""

# Try to get git hash if git is available and we're in a git repository
if command -v git &> /dev/null; then
  if git rev-parse --is-inside-work-tree &> /dev/null; then
    GIT_HASH=$(git rev-parse --short HEAD)
  fi
fi

# Create a release ID combining timestamp and git hash if available
if [ -n "$GIT_HASH" ]; then
  RELEASE_ID="${BUILD_TIMESTAMP}-${GIT_HASH}"
else
  RELEASE_ID="${BUILD_TIMESTAMP}"
fi

# Check if directory exists
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  print_error "Required project directories not found. Please make sure you're running this script from the correct location."
fi

# Check if .env files exist, if not, suggest running setup-env.sh
if [ ! -f "$BACKEND_DIR/.env" ] || [ ! -f "$FRONTEND_DIR/.env" ]; then
  print_warning "Environment files not found. Running with default settings may cause issues."
  print_info "Consider running ./setup-env.sh first."
fi

print_section "Building Backend for Production"

# Navigate to backend directory
cd "$BACKEND_DIR" || print_error "Failed to navigate to backend directory"

# Ensure we have a .env.production file with proper settings
if [ ! -f .env.production ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.production
    # Update NODE_ENV in the production env file
    sed -i.bak 's/NODE_ENV=.*/NODE_ENV=production/g' .env.production
    rm -f .env.production.bak  # Clean up backup file
    print_info "Created .env.production from .env.example and set NODE_ENV=production"
  else
    print_warning ".env.example not found. Creating a basic .env.production file..."
    
    # Create basic .env.production file
    cat > .env.production << EOL
# Database - Update these values for your production environment
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventia?schema=public"

# Server
PORT=5001
NODE_ENV=production

# JWT - Use strong secrets in production
JWT_SECRET=eventia_prod_jwt_secret_change_me
JWT_EXPIRES_IN=1d

# Stripe - Add your production keys
STRIPE_SECRET_KEY=sk_prod_your_stripe_prod_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Redis
REDIS_URL=redis://localhost:6379

# Sentry (Recommended for production error tracking)
# SENTRY_DSN=

# Email (Required for production)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# EMAIL_FROM=noreply@eventia.com
EOL
    print_warning "Basic .env.production file created. Please update with your actual production credentials."
  fi
fi

# Install dependencies if node_modules doesn't exist or we're forcing a reinstall
if [ ! -d "node_modules" ]; then
  print_info "Installing backend dependencies..."
  npm ci || print_error "Failed to install backend dependencies"
  print_success "Backend dependencies installed"
else
  print_info "Using existing backend dependencies"
fi

# Run Prisma generate to ensure we have the latest client
if [ -d "prisma" ]; then
  print_info "Generating Prisma client..."
  NODE_ENV=production npx prisma generate || print_error "Failed to generate Prisma client"
  print_success "Prisma client generated"
fi

# Set NODE_ENV for the build
print_info "Building backend with NODE_ENV=production..."
NODE_ENV=production npm run build || print_error "Failed to build backend"
print_success "Backend built successfully"

# Verify the build
if [ ! -d "dist" ]; then
  print_error "Backend build failed: 'dist' directory not found"
else
  # Check for key file(s) in dist directory
  if [ ! -f "dist/index.js" ] && [ ! -f "dist/server.js" ] && [ ! -f "dist/app.js" ]; then
    print_error "Backend build appears incomplete. Main server file not found in 'dist' directory."
  else
    print_success "Backend build verified"
  fi
fi

print_section "Building Frontend for Production"

# Navigate to frontend directory
cd "$FRONTEND_DIR" || print_error "Failed to navigate to frontend directory"

# Create or update .env.production for frontend
if [ ! -f .env.production ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.production
    print_info "Created .env.production from .env.example"
  else
    print_warning ".env.example not found. Creating a basic .env.production file..."
    
    # Create basic .env.production file
    cat > .env.production << EOL
# API Configuration - Update these for your production environment
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_WS_URL=wss://api.yourdomain.com

# Application settings
VITE_APP_VERSION=1.0.0
VITE_RELEASE_ID=${RELEASE_ID}
VITE_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VITE_ENVIRONMENT=production

# Analytics & Monitoring 
# VITE_SENTRY_DSN=

# Payment Gateway - Add your production keys
VITE_PAYMENT_GATEWAY_PUBLIC_KEY=pk_prod_your_stripe_prod_key
EOL
    print_warning "Basic .env.production file created. Please update with your actual production values."
  fi

  # Always update the release ID and build timestamp in the production env
  sed -i.bak "s/VITE_RELEASE_ID=.*/VITE_RELEASE_ID=${RELEASE_ID}/g" .env.production
  sed -i.bak "s/VITE_BUILD_TIMESTAMP=.*/VITE_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")/g" .env.production
  sed -i.bak "s/VITE_ENVIRONMENT=.*/VITE_ENVIRONMENT=production/g" .env.production
  rm -f .env.production.bak  # Clean up backup file
  print_info "Updated release ID (${RELEASE_ID}) and build timestamp in .env.production"
fi

# Install dependencies if node_modules doesn't exist or we're forcing a reinstall
if [ ! -d "node_modules" ]; then
  print_info "Installing frontend dependencies..."
  npm ci || print_error "Failed to install frontend dependencies"
  print_success "Frontend dependencies installed"
else
  print_info "Using existing frontend dependencies"
fi

# Set NODE_ENV for the build
print_info "Building frontend with NODE_ENV=production..."
NODE_ENV=production npm run build || print_error "Failed to build frontend"
print_success "Frontend built successfully"

# Verify the build
if [ ! -d "dist" ]; then
  print_error "Frontend build failed: 'dist' directory not found"
else
  # Check for key files in dist directory
  if [ ! -f "dist/index.html" ]; then
    print_error "Frontend build appears incomplete. index.html not found in 'dist' directory."
  else
    print_success "Frontend build verified"
  fi
fi

print_section "Production Build Summary"
echo "Backend build: $BACKEND_DIR/dist"
echo "Frontend build: $FRONTEND_DIR/dist"
echo "Release ID: $RELEASE_ID"
echo "Build timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

print_info "To run the production build, execute:"
echo -e "${MAGENTA}./run-prod.sh${NC}"

print_success "Production build completed successfully!" 
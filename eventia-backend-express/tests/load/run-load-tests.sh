#!/bin/bash

# Script to run all load tests for Eventia backend

# Default API URL
API_URL=${1:-"http://localhost:3000/api/v1"}

# Create results directory if it doesn't exist
RESULTS_DIR="./results"
mkdir -p "$RESULTS_DIR"

# Get current timestamp for results files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "=== Eventia Load Testing Suite ==="
echo "API URL: $API_URL"
echo "Results will be saved to $RESULTS_DIR"
echo ""

# Run events load test
echo "Running Events Load Test..."
k6 run -e API_URL="$API_URL" --out json="$RESULTS_DIR/events_$TIMESTAMP.json" events-load.js
echo ""

# Run booking flow load test
echo "Running Booking Flow Load Test..."
k6 run -e API_URL="$API_URL" --out json="$RESULTS_DIR/booking_flow_$TIMESTAMP.json" booking-flow.js
echo ""

# Run payment verification load test
echo "Running Payment Verification Load Test..."
k6 run -e API_URL="$API_URL" --out json="$RESULTS_DIR/payment_verification_$TIMESTAMP.json" payment-verification.js
echo ""

echo "=== Load Testing Complete ==="
echo "Results saved to $RESULTS_DIR"
#!/bin/bash

# Start Server Script for Eventia Platform
# This script will start the server with the correct DATABASE_URL

echo "🚀 Starting Eventia backend server..."

# Set the DATABASE_URL explicitly
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventia"

# Start the server
npx ts-node src/server.ts

# Exit with the server's exit code
exit $? 
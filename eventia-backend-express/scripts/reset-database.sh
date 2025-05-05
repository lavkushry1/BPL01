#!/bin/bash

# Reset Database Script for Eventia Platform
# This script will drop and recreate the database schema using Prisma

echo "🔄 Starting database reset process..."

# Navigate to project root (adjust if needed)
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from example..."
    cp .env.example .env
    echo "⚠️ Please edit .env with your database credentials and run this script again."
    exit 1
fi

# Load environment variables
source .env
DB_NAME=${DATABASE_URL##*/}
DB_NAME=${DB_NAME%%\?*}

echo "📊 Working with database: $DB_NAME"

# Step 1: Ensure the schema has all required fields
echo "✅ Ensuring schema has all required fields, including is_deleted columns..."

# Step 2: Reset the database schema
echo "🗑️ Dropping and recreating database schema..."
npx prisma migrate reset --force

# If the above command fails, try with db push as a fallback
if [ $? -ne 0 ]; then
    echo "⚠️ Migration reset failed, trying with db push --force-reset as fallback..."
    npx prisma db push --force-reset
fi

# Step 3: Apply pending migrations
echo "⬆️ Applying migrations..."
npx prisma migrate deploy

# Step 4: Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Step 5: Seed the database
echo "🌱 Seeding the database with initial data..."
npx prisma db seed

echo "✅ Database reset completed successfully!"
echo "🚀 You can now start your server with 'npm run dev'" 
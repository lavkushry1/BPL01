#!/bin/bash

# Migration cleanup script to remove Supabase from the project

echo "Starting Supabase removal process..."

# 1. Remove Supabase directory
echo "Removing Supabase configuration directory..."
rm -rf eventia-ticketing-flow1/supabase

# 2. Make sure @supabase/supabase-js is uninstalled
echo "Ensuring Supabase JS client is uninstalled..."
cd eventia-ticketing-flow1 && npm uninstall @supabase/supabase-js

# 3. Remove any potential Supabase types or client configuration
echo "Removing any Supabase client configuration files..."
rm -rf eventia-ticketing-flow1/src/integrations/supabase

# 4. Check for any remaining Supabase references
echo "Checking for remaining Supabase references in codebase..."
grep -r "supabase" --include="*.ts" --include="*.tsx" eventia-ticketing-flow1/src

echo "Migration cleanup complete! The codebase is now using the Express backend for all operations."
echo "Note: You may still see some commented references to Supabase in documentation or code comments." 
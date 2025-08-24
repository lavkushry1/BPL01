-- Create user if not exists
CREATE USER lavkushkumar WITH PASSWORD 'postgres';

-- Create database if not exists
CREATE DATABASE eventia;

-- Grant privileges to user
ALTER USER lavkushkumar WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE eventia TO lavkushkumar;

-- Connect to the eventia database
\c eventia;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone to UTC by default
ALTER DATABASE eventia SET timezone TO 'UTC'; 
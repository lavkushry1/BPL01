-- Create a role for our application
CREATE ROLE eventia WITH LOGIN PASSWORD 'securepass';

-- Create the database
CREATE DATABASE eventia;

-- Make eventia the owner of the database
ALTER ROLE eventia WITH SUPERUSER;

-- Grant all privileges on database to eventia
GRANT ALL PRIVILEGES ON DATABASE eventia TO eventia;

\c eventia

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set the timezone for the database
ALTER DATABASE eventia SET timezone TO 'UTC'; 
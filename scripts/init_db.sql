-- Database initialization script
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- Create the database if it doesn't exist (handled by POSTGRES_DB env var)
-- This script runs in the context of the masap_uganc database

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE masap_uganc TO postgres;

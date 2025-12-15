-- TukioHub Database Setup Script
-- Run this with: sudo -u postgres psql -f setup_db.sql

-- Create database
CREATE DATABASE tukiohub_db;

-- Create user with CREATEDB privilege (needed for running tests)
CREATE USER tukiohub_user WITH PASSWORD 'TukioHub2024DB99' CREATEDB;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tukiohub_db TO tukiohub_user;

-- Connect to the database and grant schema privileges
\c tukiohub_db

-- Grant schema privileges (for PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO tukiohub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tukiohub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tukiohub_user;

-- Display success message
\echo 'Database tukiohub_db created successfully!'
\echo 'User tukiohub_user created - password stored in CREDENTIALS.md'

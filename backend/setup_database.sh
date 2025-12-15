#!/bin/bash

# TukioHub Database Setup Script

echo "================================================"
echo "TukioHub PostgreSQL Database Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}Starting PostgreSQL service...${NC}"
    sudo systemctl start postgresql
fi

echo "Creating database and user..."
echo ""

# Run the SQL script
sudo -u postgres psql -f setup_db.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
    echo ""
    echo "Database Details:"
    echo "  Database Name: tukiohub_db"
    echo "  Username: tukiohub_user"
    echo "  Password: (stored in CREDENTIALS.md)"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo ""
    echo "Next steps:"
    echo "  1. Run: python manage.py migrate"
    echo "  2. Run: python manage.py createsuperuser"
    echo "  3. Run: python manage.py runserver"
else
    echo ""
    echo -e "${RED}✗ Database setup failed!${NC}"
    echo ""
    echo "If the database already exists, you can drop it with:"
    echo "  sudo -u postgres psql -c 'DROP DATABASE IF EXISTS tukiohub_db;'"
    echo "  sudo -u postgres psql -c 'DROP USER IF EXISTS tukiohub_user;'"
    echo ""
    echo "Then run this script again."
fi

echo ""
echo "================================================"

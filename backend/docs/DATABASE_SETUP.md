# TukioHub PostgreSQL Database Setup

## Quick Setup (Recommended)

Run the automated setup script:

```bash
cd /home/bonnie/Projects/eventms/backend
./setup_database.sh
```

This will:
- Start PostgreSQL if not running
- Create database `tukiohub_db`
- Create user `tukiohub_user` with a secure password
- Grant all necessary privileges
- Password is stored in `CREDENTIALS.md`

---

## Manual Setup (Alternative)

If the automated script doesn't work, run these commands manually:

### 1. Create Database and User

```bash
sudo -u postgres psql -f setup_db.sql
```

Or run SQL commands directly:

```bash
sudo -u postgres psql << EOF
CREATE DATABASE tukiohub_db;
CREATE USER tukiohub_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE tukiohub_db TO tukiohub_user;

\c tukiohub_db

GRANT ALL ON SCHEMA public TO tukiohub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tukiohub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tukiohub_user;
EOF
```

---

## After Database Setup

### 1. Activate Virtual Environment

```bash
cd /home/bonnie/Projects/eventms/backend
source venv/bin/activate
```

### 2. Run Database Migrations

```bash
python manage.py migrate
```

Expected output:
```
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying users.0001_initial... OK
  Applying admin.0001_initial... OK
  ...
```

### 3. Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

You'll be prompted for:
- Email address
- Phone number
- Password

Example:
```
Email address: admin@tukiohub.com
Phone number: +254712345678
Password: ********
Password (again): ********
Superuser created successfully.
```

### 4. Start Development Server

```bash
python manage.py runserver
```

Expected output:
```
System check identified no issues (0 silenced).
Django version 5.0.1, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

---

## Test the API

### Option 1: Swagger UI (Recommended)
Open your browser and visit:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

### Option 2: Django Admin
- **Admin Panel**: http://localhost:8000/admin/
- Login with the superuser credentials you created

### Option 3: cURL

**Register a new user:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "StrongPass123!",
    "password2": "StrongPass123!",
    "phone_number": "+254712345678",
    "company_name": "Test Events Co"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "StrongPass123!"
  }'
```

**Get User Profile (requires token):**
```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### "FATAL: Peer authentication failed"
If you get authentication errors, edit PostgreSQL's `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Change:
```
local   all             all                                     peer
```

To:
```
local   all             all                                     md5
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### "Database already exists"
If you need to recreate the database:

```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS tukiohub_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS tukiohub_user;"
./setup_database.sh
```

### "Could not connect to server"
Make sure PostgreSQL is running:

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Check Database Connection
Test if you can connect to the database:

```bash
psql -h localhost -U tukiohub_user -d tukiohub_db -W
# Password: (see CREDENTIALS.md)
```

---

## Database Credentials

**Database Name:** tukiohub_db
**Username:** tukiohub_user
**Password:** See `CREDENTIALS.md` file (not in version control)
**Host:** localhost
**Port:** 5432

These settings are already configured in `.env` file.

---

## Useful PostgreSQL Commands

```bash
# Connect to database
psql -h localhost -U tukiohub_user -d tukiohub_db

# List all tables
\dt

# Describe users_user table
\d users_user

# Show all users
SELECT * FROM users_user;

# Quit
\q
```

---

## Reset Database (Development Only)

**⚠️ WARNING: This will delete all data!**

```bash
# Drop all tables
python manage.py flush

# Or recreate database from scratch
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS tukiohub_db;
CREATE DATABASE tukiohub_db;
GRANT ALL PRIVILEGES ON DATABASE tukiohub_db TO tukiohub_user;
EOF

# Re-run migrations
python manage.py migrate
python manage.py createsuperuser
```

---

## Next Steps

After successful database setup and testing:

1. Run automated tests: `pytest apps/users/tests/ -v`
2. Check code quality: `black apps/users/ && flake8 apps/users/`
3. Merge feature branch to dev
4. Push to GitHub

---

**Need Help?** Check the main `README.md` or Sprint 2 documentation.

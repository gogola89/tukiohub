# Swagger UI Authentication Guide

## Quick Fix for "Authentication credentials not provided"

**Problem**: Getting authentication error even after clicking Authorize

**Solution**: You need to enter `Bearer ` (with a space) before your token!

## Step-by-Step Authentication

### Step 1: Login to Get Token

1. Open Swagger UI: http://localhost:8000/swagger/
2. Scroll to the **"Authentication"** section
3. Find `/api/auth/login/` endpoint
4. Click **"Try it out"**
5. Enter your credentials:
   ```json
   {
     "email": "admin@tukiohub.com",
     "password": "your_password"
   }
   ```
6. Click **"Execute"**
7. **Copy the `access` token** from the response (not the entire response, just the token value)

Example response:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY1OTY1NDcxLCJpYXQiOjE3NjU5NjE4NzEsImp0aSI6IjVkNmM3MDA5YmFhZTQyY2RhNjc1NjM1ZjIzY2Y0NjVmIiwidXNlcl9pZCI6ImUxZjU4NTJhLTU5ZjAtNDU2Ni04ZTY4LWJmZWRmOTNiNGZlYyJ9.vc_F8DXI1si0bfhMAZgtcA9kx0zQQiWM2_s5EnegNRk",
  "refresh": "..."
}
```

**Copy this token** (the long string value):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY1OTY1NDcxLCJpYXQiOjE3NjU5NjE4NzEsImp0aSI6IjVkNmM3MDA5YmFhZTQyY2RhNjc1NjM1ZjIzY2Y0NjVmIiwidXNlcl9pZCI6ImUxZjU4NTJhLTU5ZjAtNDU2Ni04ZTY4LWJmZWRmOTNiNGZlYyJ9.vc_F8DXI1si0bfhMAZgtcA9kx0zQQiWM2_s5EnegNRk
```

### Step 2: Authorize in Swagger

1. **Look for the Authorize button** at the top right of the Swagger UI page
   - It looks like: 🔓 **Authorize** (green button) or a lock icon

2. **Click the Authorize button**

3. **In the popup dialog**:
   - You'll see a field labeled "Value"
   - **Type exactly**: `Bearer ` (the word Bearer with a space after it)
   - **Then paste your token** after the space

   ✅ **CORRECT FORMAT**:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY1OTY1NDcxLCJpYXQiOjE3NjU5NjE4NzEsImp0aSI6IjVkNmM3MDA5YmFhZTQyY2RhNjc1NjM1ZjIzY2Y0NjVmIiwidXNlcl9pZCI6ImUxZjU4NTJhLTU5ZjAtNDU2Ni04ZTY4LWJmZWRmOTNiNGZlYyJ9.vc_F8DXI1si0bfhMAZgtcA9kx0zQQiWM2_s5EnegNRk
   ```

   ❌ **WRONG FORMAT** (missing "Bearer "):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY1OTY1NDcxLCJpYXQiOjE3NjU5NjE4NzEsImp0aSI6IjVkNmM3MDA5YmFhZTQyY2RhNjc1NjM1ZjIzY2Y0NjVmIiwidXNlcl9pZCI6ImUxZjU4NTJhLTU5ZjAtNDU2Ni04ZTY4LWJmZWRmOTNiNGZlYyJ9.vc_F8DXI1si0bfhMAZgtcA9kx0zQQiWM2_s5EnegNRk
   ```

4. **Click "Authorize"** button in the dialog

5. **Click "Close"** to close the dialog

6. **The lock icon should now show as locked** 🔒

### Step 3: Test an Authenticated Endpoint

1. Scroll to any endpoint that requires authentication (e.g., `/api/admin/dashboard/`)
2. Click **"Try it out"**
3. Click **"Execute"**
4. You should get a **200 OK** response with data

## Visual Verification

### How to Know You're Authenticated

**BEFORE Authorization**:
- Lock icon shows as: 🔓 (unlocked/open)
- Authorization header in curl: `-H 'Authorization: '` (empty)

**AFTER Authorization**:
- Lock icon shows as: 🔒 (locked/closed)
- Authorization header in curl: `-H 'Authorization: Bearer eyJhbGci...'` (includes Bearer + token)

### Check Your curl Command

When you click "Execute", look at the curl command displayed. It should show:

✅ **CORRECT**:
```bash
curl -X 'GET' \
  'http://localhost:8000/api/admin/organizers/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

❌ **WRONG** (what you had before):
```bash
curl -X 'GET' \
  'http://localhost:8000/api/admin/organizers/' \
  -H 'accept: application/json' \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Notice**: The correct version has `Bearer ` before the token!

## Common Errors and Solutions

### Error: "Authentication credentials were not provided"

**Cause**: You forgot to include "Bearer " before the token

**Solution**:
1. Click Authorize again
2. Make sure you typed: `Bearer ` (with a space) before your token
3. Re-authorize

### Error: "Invalid token" or "Token is invalid or expired"

**Cause**:
- Token expired (tokens expire after 1 hour)
- Wrong token format
- Token copied incorrectly (extra spaces or characters)

**Solution**:
1. Login again via `/api/auth/login/` to get a fresh token
2. Copy ONLY the token value (not the quotes or any extra characters)
3. Re-authorize with: `Bearer <new_token>`

### Error: "Given token not valid for any token type"

**Cause**: You might have copied the refresh token instead of the access token

**Solution**:
1. Make sure you're copying the `access` token, not the `refresh` token
2. The access token is the one you use for API requests

## Token Expiration

- **Access tokens expire after 1 hour**
- When your token expires, you'll get authentication errors
- **Solution**: Login again to get a new token

## Testing Admin Endpoints

Once authenticated with an admin user, you can test:

- `GET /api/admin/dashboard/` - Dashboard statistics
- `GET /api/admin/organizers/` - List all organizers
- `GET /api/admin/organizers/{id}/` - View organizer details
- `PATCH /api/admin/organizers/{id}/` - Update organizer
- `POST /api/admin/organizers/{id}/approve-reject/` - Approve/reject organizer
- `GET /api/admin/analytics/` - Analytics data

## Testing with curl (Outside Swagger)

If you want to test with curl directly in terminal:

```bash
# 1. Login to get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tukiohub.com", "password": "your_password"}'

# 2. Copy the access token from response

# 3. Use token in requests (notice Bearer prefix!)
curl -X GET http://localhost:8000/api/admin/dashboard/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════════╗
║                SWAGGER JWT AUTHENTICATION                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Login via /api/auth/login/                                ║
║  2. Copy the "access" token                                    ║
║  3. Click "Authorize" button (🔓)                              ║
║  4. Enter: Bearer <space> <your_token>                         ║
║  5. Click Authorize, then Close                                ║
║                                                                ║
║  ✅ CORRECT: Bearer eyJhbGci...                                ║
║  ❌ WRONG:   eyJhbGci...                                       ║
║                                                                ║
║  Token expires in: 1 hour                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## Troubleshooting Checklist

- [ ] Did you include "Bearer " (with space) before the token?
- [ ] Did you copy the entire token (starts with eyJ)?
- [ ] Did you click "Authorize" after entering the token?
- [ ] Is your token less than 1 hour old?
- [ ] Are you using the "access" token (not "refresh")?
- [ ] Did you copy the token correctly without extra spaces?

---

**Last Updated**: December 17, 2025
**For**: TukioHub Backend API - Sprint 4

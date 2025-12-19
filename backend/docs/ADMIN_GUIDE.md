# Django Admin Panel Guide - TukioHub

## Overview

The Django Admin panel provides a comprehensive interface for managing all aspects of TukioHub without needing the frontend dashboard.

## Access

**URL:** `http://localhost:8000/admin/` or `https://your-ngrok-url.ngrok-free.app/admin/`

**Login:** Use your superuser credentials

### Create a Superuser (if you haven't already)

```bash
source venv/bin/activate
python manage.py createsuperuser
```

Follow the prompts to enter:
- Email address
- Password
- Confirm password

## Available Management Sections

### 1. Users Management

**Location:** Admin > Users > Users

**Features:**
- View all users (organizers, admins)
- Filter by: role, verification status, email verified, active status, creation date
- Search by: email, company name, phone number
- Approve/reject organizers by changing `verification_status`
- View verification documents
- Activate/deactivate users

**Actions:**
- **Approve Organizer:** Change `verification_status` to "APPROVED"
- **Reject Organizer:** Change `verification_status` to "REJECTED"
- **Deactivate Account:** Uncheck `is_active`
- **Make Staff:** Check `is_staff` (can access admin panel)
- **Make Superuser:** Check `is_superuser` (full admin access)

**Inline Management:**
- Password resets
- Email verifications

---

### 2. Events Management

**Location:** Admin > Events > Events

**Features:**
- View all events with status, category, capacity
- See tickets sold and sold out status
- Filter by: status, category, free/paid, date range
- Search by: title, description, venue, organizer
- Featured image preview
- Inline management of:
  - Ticket types
  - Promo codes
  - Add-ons
  - Event images

**Key Fields:**
- **Status:** DRAFT, PUBLISHED, CANCELLED, COMPLETED
- **Statistics:** View real-time data (upcoming, sold out, available tickets, price range)
- **Venue:** Name, address, coordinates (latitude/longitude)

**Actions:**
- **Publish Event:** Change status from DRAFT to PUBLISHED
- **Cancel Event:** Change status to CANCELLED
- **Add Ticket Types:** Use inline section at bottom
- **Add Promo Codes:** Use inline section
- **Upload Images:** Use inline section for gallery

**Read-Only Stats:**
- Is Upcoming
- Is Sold Out
- Available Tickets
- Min/Max Price
- Created/Updated timestamps

---

### 3. Ticket Types Management

**Location:** Admin > Events > Ticket Types

**Features:**
- Manage ticket types across all events
- View pricing, inventory, sales period
- Track quantity sold vs available
- Filter by: ticket type, active status, sales date
- Search by: event name, ticket name

**Key Fields:**
- **Name:** VVIP, VIP, REGULAR, EARLY_BIRD, STUDENT, GROUP
- **Price:** Ticket price in KES
- **Quantity Available:** Total tickets for this type
- **Quantity Sold:** Automatically tracked (read-only)
- **Sales Period:** Start and end date for ticket sales
- **Is Active:** Enable/disable ticket type

**Inventory Management:**
- Monitor available quantity (calculated automatically)
- Track sales in real-time
- Prevent overselling (handled by booking system)

---

### 4. Promo Codes Management

**Location:** Admin > Events > Promo Codes

**Features:**
- Create and manage discount codes
- Track usage and validity
- Filter by: discount type, active status, validity period
- Search by: code, event name

**Key Fields:**
- **Code:** Uppercase promo code (e.g., "EARLYBIRD2024")
- **Discount Type:** PERCENTAGE or FIXED
- **Discount Value:**
  - Percentage: 10, 20, 50, etc. (%)
  - Fixed: 100, 500, 1000 (KES)
- **Usage Limit:** Max number of times code can be used (blank = unlimited)
- **Times Used:** Automatically tracked (read-only)
- **Validity Period:** Start and end date

**Status Indicators:**
- **Valid Now:** Green checkmark if currently valid
- **Can Be Used:** Green checkmark if usage limit not exceeded

**Actions:**
- **Create Code:** Click "Add Promo Code"
- **Disable Code:** Uncheck "is_active"
- **Monitor Usage:** View "times_used" field

---

### 5. Event Add-ons Management

**Location:** Admin > Events > Event Add-ons

**Features:**
- Manage optional add-ons (parking, merchandise, etc.)
- Set pricing and quantity
- Filter by: active status, creation date
- Search by: name, event name

**Key Fields:**
- **Name:** "VIP Parking", "Event T-Shirt", "Meal Package"
- **Price:** Add-on price in KES
- **Quantity Available:** Total quantity (blank = unlimited)
- **Is Unlimited:** Automatically determined (read-only)
- **Is Active:** Enable/disable add-on

---

### 6. Event Images Management

**Location:** Admin > Events > Event Images

**Features:**
- Manage event gallery images
- Set display order
- Preview images in admin
- Filter by creation date

**Key Fields:**
- **Event:** Associated event
- **Image:** Upload image file
- **Order:** Display order (0 = first, 1 = second, etc.)
- **Preview:** Thumbnail preview in admin

**Best Practices:**
- Use order field to control gallery sequence
- Lower numbers display first
- Maximum file size: 5MB (configured in serializers)

---

### 7. Payments & Transactions

**Location:** Admin > Payments > Transactions

**Features:**
- View all payment transactions
- Track M-Pesa and card payments
- Monitor payment status
- Filter by: status, payment method, date
- Search by: transaction reference, M-Pesa receipt, phone number, event

**Key Fields:**
- **Transaction Reference:** Unique identifier (e.g., "TH12AB34CD")
- **Event:** Associated event
- **Booking Reference:** Linked booking (when available)
- **Amount:** Payment amount in KES
- **Phone Number:** Customer phone number
- **Payment Method:** MPESA or CARD
- **Status:** PENDING, COMPLETED, FAILED, CANCELLED

**M-Pesa Details:**
- Checkout Request ID
- Merchant Request ID
- M-Pesa Receipt Number

**Result Information:**
- Result Code (0 = success)
- Result Description
- Metadata (additional info)

**Timestamps:**
- Created At
- Updated At
- Completed At

**Read-Only Fields:**
- All fields are read-only for audit purposes
- Cannot add or delete transactions manually
- Transactions are created via API only

---

## Common Administrative Tasks

### 1. Approve a New Organizer

1. Go to **Users > Users**
2. Click on the pending organizer
3. Review their information
4. Check `verification_documents` if uploaded
5. Change `verification_status` to "APPROVED"
6. Click **Save**
7. Organizer will receive approval email (when email system is configured)

### 2. Create a New Event (As Admin)

1. Go to **Events > Events**
2. Click **Add Event**
3. Fill in basic information:
   - Select organizer
   - Enter title (slug auto-generated)
   - Add description
   - Choose category
   - Set status to DRAFT initially
4. Add event details (dates, capacity, venue)
5. Upload featured image
6. Click **Save and continue editing**
7. Add ticket types in inline section:
   - Name, price, quantity, sales period
8. Optionally add promo codes
9. Change status to PUBLISHED when ready
10. Click **Save**

### 3. Monitor Ticket Sales

1. Go to **Events > Events**
2. Click on the event
3. View statistics section:
   - Tickets Sold
   - Available Tickets
   - Is Sold Out
4. Scroll to Ticket Types inline section
5. Check `quantity_sold` for each type

### 4. Track Payment Transactions

1. Go to **Payments > Transactions**
2. Filter by:
   - Status (PENDING, COMPLETED, FAILED)
   - Date range
   - Payment method
3. Click transaction to view details:
   - M-Pesa receipt number
   - Result code and description
   - Callback metadata
4. Check `completed_at` for successful payments

### 5. Create a Promo Code

1. Go to **Events > Promo Codes**
2. Click **Add Promo Code**
3. Select event
4. Enter code (will be auto-uppercased)
5. Choose discount type:
   - PERCENTAGE: Enter value like 10, 20, 50
   - FIXED: Enter amount like 100, 500
6. Set validity period (start and end dates)
7. Optional: Set usage limit
8. Check "is_active"
9. Click **Save**

### 6. Bulk Actions

Django admin supports bulk actions:

**Select Multiple Items:**
- Check boxes next to items
- Choose action from dropdown
- Click **Go**

**Common Bulk Actions:**
- Activate/deactivate multiple items
- Delete selected items (use with caution)

---

## Tips & Best Practices

### Search Tips
- Use partial matches: "music" finds "Music Festival", "Live Music"
- Search is case-insensitive
- Multiple fields are searched simultaneously

### Filtering
- Combine multiple filters for precise results
- Use date hierarchy at top for quick date filtering
- Clear filters with "Clear all filters" link

### Performance
- Admin is optimized with `select_related` and `prefetch_related`
- Large datasets are paginated (20 items per page)
- Use filters to narrow results

### Data Safety
- Transactions cannot be manually deleted (audit trail)
- Soft delete is used for events (status = CANCELLED)
- Always backup database before bulk operations

### Inline Editing
- Edit related items without leaving parent page
- Add multiple ticket types, promo codes at once
- Save all changes together

---

## Keyboard Shortcuts

- **Save:** `Ctrl + S` or `Cmd + S`
- **Cancel:** `Esc` (in change form)
- **Search:** Click search box (no shortcut)

---

## Troubleshooting

### Can't Login
- Verify you created a superuser
- Check credentials
- Ensure `is_active` is checked
- Verify ngrok URL is in `CSRF_TRUSTED_ORIGINS`

### Missing Fields
- Some fields are read-only (grayed out)
- Auto-calculated fields cannot be edited
- Timestamps are auto-managed

### Image Not Displaying
- Check media files are being served
- In development: `DEBUG = True` required
- Check `MEDIA_URL` and `MEDIA_ROOT` settings

### Slow Loading
- Use filters to limit results
- Check database connection
- Clear browser cache
- Optimize images before upload

---

## Security Notes

### Admin Access Control

**Superuser:**
- Full access to everything
- Can create/delete/modify all data
- Can grant admin access to others

**Staff User:**
- Can access admin panel
- Permissions controlled by user permissions
- Cannot access everything by default

**Regular User:**
- Cannot access admin panel
- Must use frontend dashboard (when built)

### Best Practices

1. **Limit Superuser Access:** Only trusted administrators
2. **Use Staff Permissions:** Grant specific permissions only
3. **Audit Regularly:** Check user actions in logs
4. **Strong Passwords:** Enforce password requirements
5. **Two-Factor Auth:** Consider django-two-factor-auth package
6. **HTTPS Only:** In production, always use HTTPS

---

## Next Steps

While the admin panel provides full management capabilities, the frontend dashboard will provide:

- Better user experience for organizers
- Event analytics and charts
- Custom workflows
- Public-facing pages
- Mobile responsiveness
- Custom branding

The admin panel is perfect for:
- Administrative tasks
- System management
- Quick edits
- Data verification
- Troubleshooting

---

**Last Updated:** December 19, 2024
**Version:** 1.0
**Sprint:** 10 - M-Pesa Integration Complete

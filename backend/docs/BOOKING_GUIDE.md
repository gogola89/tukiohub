# Booking System Guide - Sprint 12

This guide explains the booking and ticketing system implementation for TukioHub.

## Overview

The booking system provides:
- **Guest checkout** (no user registration required)
- **Inventory locking** to prevent overselling
- **QR code ticket generation**
- **PDF ticket delivery** via email
- **SMS notifications** for confirmations
- **5-minute booking timeout** for unpaid bookings
- **Ticket verification and check-in**
- **Ticket transfer** capability

---

## Database Models

### 1. Booking Model
Main booking record with guest checkout support.

**Key Fields:**
- `booking_reference`: Unique reference (BK-XXXXXX)
- `attendee_name`, `attendee_email`, `attendee_phone`: Guest info
- `total_amount`, `discount_amount`, `final_amount`: Pricing
- `status`: PENDING → CONFIRMED → CANCELLED/EXPIRED
- `payment_status`: PENDING → PAID → REFUNDED/CANCELLED
- `expires_at`: Booking expiration time (5 minutes from creation)

### 2. BookingItem Model
Individual ticket types in a booking.

**Fields:**
- `ticket_type`: Reference to TicketType
- `quantity`: Number of tickets
- `price_per_ticket`: Price at time of booking
- `subtotal`: Auto-calculated (quantity × price)

### 3. BookingAddOn Model
Add-ons purchased with booking (e.g., parking, merchandise).

**Fields:**
- `addon`: Reference to EventAddOn
- `quantity`: Number of items
- `price_per_item`: Price at time of purchase
- `subtotal`: Auto-calculated

### 4. Ticket Model
Individual tickets with QR codes.

**Key Fields:**
- `ticket_code`: Unique code for QR (TK-XXXXXXXXXXXX)
- `attendee_name`, `attendee_email`: Can differ from booking if transferred
- `status`: ACTIVE → USED/CANCELLED/TRANSFERRED
- `qr_code_image`: Generated QR code image
- `checked_in_at`, `checked_in_by`: Check-in tracking

---

## API Endpoints

### Booking Endpoints

#### 1. Create Booking
```http
POST /api/bookings/create/
```

**Request Body:**
```json
{
  "event_id": "uuid",
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "254712345678",
  "items": [
    {
      "ticket_type_id": "uuid",
      "quantity": 2
    }
  ],
  "promo_code": "EARLY2024",  // Optional
  "addons": [  // Optional
    {
      "addon_id": "uuid",
      "quantity": 1
    }
  ],
  "notes": "Special dietary requirements"  // Optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "booking_reference": "BK-A1B2C3",
  "status": "PENDING",
  "final_amount": "2500.00",
  "expires_at": "2024-12-20T10:10:00Z",
  "event": {
    "id": "uuid",
    "title": "Tech Conference 2024"
  },
  "items": [...],
  "addons": [...]
}
```

**Important:**
- Booking status is **PENDING** until payment is received
- Inventory is **locked** for 5 minutes
- If payment not received within 5 minutes, booking **expires** and inventory is released

#### 2. Get Booking Details
```http
GET /api/bookings/{booking_reference}/
```

**Example:**
```http
GET /api/bookings/BK-A1B2C3/
```

**Response:**
```json
{
  "booking_reference": "BK-A1B2C3",
  "status": "CONFIRMED",
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "total_amount": "3000.00",
  "discount_amount": "500.00",
  "final_amount": "2500.00",
  "items": [...],
  "tickets": [
    {
      "ticket_code": "TK-1A2B3C4D5E6F",
      "status": "ACTIVE"
    }
  ]
}
```

#### 3. Cancel Booking
```http
POST /api/bookings/{booking_reference}/cancel/
```

**Request Body (optional):**
```json
{
  "reason": "Unable to attend"
}
```

**Response:**
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "booking_reference": "BK-A1B2C3",
    "status": "CANCELLED"
  }
}
```

**Note:** Cancelling a booking:
- Releases inventory back to ticket pool
- Marks all tickets as CANCELLED
- Does NOT process refunds automatically (refunds handled separately)

---

### Ticket Endpoints

#### 1. Verify Ticket
```http
POST /api/bookings/tickets/verify/
```

**Request Body:**
```json
{
  "ticket_code": "TK-1A2B3C4D5E6F"
}
```

**Response:**
```json
{
  "valid": true,
  "ticket": {
    "ticket_code": "TK-1A2B3C4D5E6F",
    "attendee_name": "John Doe",
    "ticket_type": {
      "name": "VIP",
      "price": "1500.00"
    },
    "status": "ACTIVE",
    "event": {
      "title": "Tech Conference 2024",
      "start_datetime": "2024-12-25T10:00:00Z"
    }
  },
  "can_check_in": true
}
```

#### 2. Check-In Ticket
```http
PUT /api/bookings/tickets/{ticket_code}/checkin/
```

**Authentication:** Required (staff/organizer)

**Request Body (optional):**
```json
{
  "checked_in_by": "Staff Name"
}
```

**Response:**
```json
{
  "message": "Ticket checked in successfully",
  "ticket": {
    "ticket_code": "TK-1A2B3C4D5E6F",
    "status": "USED",
    "checked_in_at": "2024-12-25T10:15:00Z",
    "checked_in_by": "Staff Name"
  }
}
```

**Important:**
- Only **ACTIVE** tickets can be checked in
- Tickets can only be checked in **once**
- Only event organizer or staff can check in tickets

#### 3. Transfer Ticket
```http
POST /api/bookings/tickets/{ticket_code}/transfer/
```

**Request Body:**
```json
{
  "new_attendee_name": "Jane Smith",
  "new_attendee_email": "jane@example.com"
}
```

**Response:**
```json
{
  "message": "Ticket transferred successfully",
  "ticket": {
    "ticket_code": "TK-1A2B3C4D5E6F",
    "attendee_name": "Jane Smith",
    "attendee_email": "jane@example.com",
    "status": "TRANSFERRED"
  }
}
```

**Important:**
- Only **ACTIVE** tickets can be transferred
- **Cannot transfer** checked-in tickets
- Email notifications sent to both old and new owners

#### 4. Download Ticket PDF
```http
GET /api/bookings/tickets/{ticket_code}/download/
```

**Response:** PDF file

**Example:**
```http
GET /api/bookings/tickets/TK-1A2B3C4D5E6F/download/
```

Returns a PDF file with:
- Event details
- QR code
- Ticket code
- Attendee name
- Booking reference

---

## Complete Booking Flow

### Step 1: Create Booking
```bash
curl -X POST http://localhost:8000/api/bookings/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVENT_UUID",
    "attendee_name": "John Doe",
    "attendee_email": "john@example.com",
    "attendee_phone": "254712345678",
    "items": [
      {"ticket_type_id": "TICKET_TYPE_UUID", "quantity": 2}
    ]
  }'
```

**Response:**
- Booking created with status **PENDING**
- Inventory **locked** for 5 minutes
- `booking_reference` returned (e.g., BK-A1B2C3)
- `final_amount` to be paid

### Step 2: Initiate Payment
```bash
curl -X POST http://localhost:8000/api/payments/mpesa/initiate/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVENT_UUID",
    "phone_number": "254712345678",
    "amount": 2500.00,
    "account_reference": "BK-A1B2C3",
    "transaction_desc": "Event Tickets Payment"
  }'
```

**Important:** Link booking to transaction:
1. After creating transaction, update it with booking reference
2. When payment succeeds, booking will be confirmed automatically

### Step 3: Payment Callback Processing

When M-Pesa callback is received:
1. `process_successful_payment` task is triggered
2. Booking status updated to **CONFIRMED**
3. `generate_and_send_tickets_task` is queued
4. Tickets generated with QR codes
5. Email sent with PDF attachments
6. SMS confirmation sent

### Step 4: Ticket Delivery

**Email contains:**
- Booking confirmation details
- PDF tickets attached (one per ticket)
- Event information

**SMS contains:**
- Booking reference
- Event date/time
- Confirmation message

### Step 5: Event Check-In

At the event:
1. Attendee presents ticket (digital or printed)
2. Staff scans QR code or enters ticket code
3. System verifies ticket via `/api/bookings/tickets/verify/`
4. If valid and not checked in, staff checks in via `/api/bookings/tickets/{code}/checkin/`
5. Ticket marked as **USED**

---

## Celery Tasks

### 1. Expire Booking Task
```python
expire_booking_task.delay(booking_id)
```

**Scheduled:** 5 minutes after booking creation

**Actions:**
- Checks if booking is still PENDING
- If expired, marks as EXPIRED
- Releases inventory back to pool

### 2. Generate and Send Tickets Task
```python
generate_and_send_tickets_task.delay(booking_id)
```

**Triggered:** After successful payment

**Actions:**
- Generates individual tickets for each booking item
- Creates QR codes
- Generates PDF for each ticket
- Sends confirmation email with PDFs
- Sends SMS confirmation

### 3. Send Event Reminder Task
```python
send_event_reminder_task.delay(booking_id, hours_before=24)
```

**Scheduled:** 24 hours before event

**Actions:**
- Sends email reminder
- Sends SMS reminder
- Only for CONFIRMED bookings

### 4. Cleanup Expired Bookings Task
```python
cleanup_expired_bookings_task()
```

**Scheduled:** Weekly (via Celery Beat)

**Actions:**
- Deletes EXPIRED/CANCELLED bookings older than 30 days

---

## Admin Interface

Access Django admin at `/admin/` to manage bookings:

### Booking Admin Features:
- View all bookings with status badges
- Filter by status, payment status, event
- Search by booking reference, attendee name/email
- Inline view of booking items, add-ons, and tickets
- Bulk cancel bookings action
- Resend confirmation emails action
- QR code preview for all tickets

### Ticket Admin Features:
- View all tickets with status badges
- Filter by status, ticket type, event category
- Search by ticket code, attendee name
- Bulk check-in tickets action
- Bulk cancel tickets action
- QR code preview

---

## Email Templates

Located in `templates/emails/`:

1. **booking_confirmation.html** - Sent after successful payment
2. **event_reminder.html** - Sent 24 hours before event
3. **refund_confirmation.html** - Sent after refund processed
4. **ticket_transfer.html** - Sent to both old and new ticket owners

---

## Testing the Booking System

### Using Django Admin:

1. **Create Event with Ticket Types:**
   ```
   http://localhost:8000/admin/events/event/add/
   ```
   - Add ticket types (VIP, Regular, etc.)
   - Set quantities and prices

2. **Create Test Booking:**
   - Use Postman or curl to POST to `/api/bookings/create/`
   - Check booking appears in admin with PENDING status

3. **Simulate Payment:**
   - Create M-Pesa payment via `/api/payments/mpesa/initiate/`
   - Link transaction to booking
   - Simulate callback (see MPESA_TESTING_GUIDE.md)

4. **Verify Ticket Generation:**
   - Check bookings admin - status should be CONFIRMED
   - View tickets inline - should see generated tickets with QR codes
   - Check email (if SendGrid configured) for PDF attachments

5. **Test Ticket Verification:**
   - Copy ticket code from admin
   - POST to `/api/bookings/tickets/verify/`
   - Should return ticket details

6. **Test Check-In:**
   - Login as staff/organizer
   - PUT to `/api/bookings/tickets/{code}/checkin/`
   - Verify ticket marked as USED in admin

### Using Postman:

Import the TukioHub Postman collection from `docs/TukioHub_API.postman_collection.json`:

**Booking Flow:**
1. Authentication → Login as Organizer
2. Create Event
3. Add Ticket Types
4. Create Booking (public endpoint)
5. Initiate M-Pesa Payment
6. Simulate Callback
7. Verify Ticket
8. Check-In Ticket

---

## Important Notes

### Inventory Management:
- Uses `select_for_update()` to lock rows during booking
- Prevents race conditions and overselling
- Released on booking expiration or cancellation

### Booking Timeout:
- PENDING bookings expire after 5 minutes
- Celery task (`expire_booking_task`) handles expiration
- Inventory automatically released

### QR Code Generation:
- Uses `qrcode` library with high error correction
- QR code stores ticket code (TK-XXXXXXXXXXXX)
- Images saved to `MEDIA_ROOT/tickets/qr_codes/`

### PDF Generation:
- Uses `reportlab` library
- A4 size with professional layout
- Includes event details, QR code, attendee info
- Generated on-demand for downloads
- Cached as email attachments

### Notifications:
- **SendGrid** for emails (configure in settings)
- **Africa's Talking** for SMS (configure in settings)
- Both services fail gracefully if not configured

---

## Environment Variables

Required in `.env`:

```bash
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@tukiohub.com

# Africa's Talking
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=your_api_key

# File Storage
MEDIA_URL=/media/
MEDIA_ROOT=/path/to/media/
```

---

## Troubleshooting

### Tickets Not Generated:
- Check Celery worker is running: `celery -A config worker -l info`
- Check payment task completed: Look for "Ticket generation task queued"
- Check booking status is CONFIRMED in admin

### Email Not Received:
- Verify SendGrid API key is valid
- Check Celery logs for email errors
- Verify email address is correct

### SMS Not Received:
- Verify Africa's Talking credentials
- Check phone number format (254XXXXXXXXX)
- Sandbox mode may not send real SMS

### Booking Expired Too Quickly:
- Default timeout is 5 minutes (configured in BookingService)
- Adjust `BOOKING_TIMEOUT_MINUTES` if needed

### QR Code Images Not Displaying:
- Verify MEDIA_ROOT directory exists and is writable
- Check MEDIA_URL is configured correctly
- Ensure media files served in development (`urls.py`)

---

## Next Steps

Sprint 12 (Booking System) is now complete! Remaining sprints:

- **Sprint 13**: Event Discovery & Search (advanced filtering, geolocation)
- **Sprint 14**: Analytics & Reporting (sales analytics, attendee insights)
- **Sprint 15**: Frontend Development (React/Next.js dashboard)
- **Sprint 16**: Testing & Deployment (comprehensive testing, production deployment)

---

**Last Updated:** December 19, 2024
**Sprint:** 12 - Booking & Ticketing System
**Status:** ✅ Complete

# M-Pesa Integration Testing Guide

## Overview

This guide provides comprehensive instructions for testing the M-Pesa STK Push integration in TukioHub.

## Prerequisites

1. **Daraja API Sandbox Credentials** ✅
   - Consumer Key: `IFAbZqyAW8db76xQQxhp9tdLwZ5bwjf2eACO2i3pjx60MmE3`
   - Consumer Secret: `7H9smYP8nAltoVQWxFcfyj8fScZ6ez4mW2OLpqRiNzjl5L9yhiVCRaQNXGS8UH11`
   - Shortcode: `174379` (Sandbox default)
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

2. **Testing Phone Number**
   - Sandbox test number: `254708374149` (Safaricom provided)
   - Format: Must be in Kenyan format (254XXXXXXXXX)

3. **Callback URL**
   - For local testing, you need to expose your local server using **ngrok**
   - Install ngrok: https://ngrok.com/download
   - Run: `ngrok http 8000`
   - Update `MPESA_CALLBACK_URL` in `.env` with the ngrok URL

## Setup Instructions

### 1. Environment Configuration

Your `.env` file is already configured with:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=IFAbZqyAW8db76xQQxhp9tdLwZ5bwjf2eACO2i3pjx60MmE3
MPESA_CONSUMER_SECRET=7H9smYP8nAltoVQWxFcfyj8fScZ6ez4mW2OLpqRiNzjl5L9yhiVCRaQNXGS8UH11
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=http://localhost:8000/api/payments/mpesa/callback/
```

### 2. Start Services

#### Start Redis (Required for caching)
```bash
redis-server
# Or if using Docker:
docker run -d -p 6379:6379 redis:latest
```

#### Start Celery Worker (Required for async tasks)
```bash
source venv/bin/activate
celery -A config worker -l info
```

#### Start Django Development Server
```bash
source venv/bin/activate
python manage.py runserver
```

### 3. Expose Local Server with ngrok (For Callback Testing)

```bash
# In a new terminal
ngrok http 8000
```

After ngrok starts, you'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

**Update your `.env` file:**
```env
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback/
```

**Update Django settings** (`config/settings/development.py`):
Add your ngrok URL to `CSRF_TRUSTED_ORIGINS`:
```python
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://abc123.ngrok.io',  # Your ngrok URL
]
```

**Restart Django server** for changes to take effect.

## API Endpoints

### 1. Initiate M-Pesa Payment

**Endpoint:** `POST /api/payments/mpesa/initiate/`

**Request Body:**
```json
{
    "event_id": "your-event-uuid",
    "phone_number": "254708374149",
    "amount": 100.00,
    "account_reference": "TEST_BOOKING_001",
    "transaction_desc": "TukioHub Event Ticket Payment"
}
```

**Phone Number Formats (All Valid):**
- `254708374149` (Kenyan international format)
- `0708374149` (Local format)
- `708374149` (Without leading zero)
- `+254708374149` (With plus sign)

**Success Response:**
```json
{
    "success": true,
    "message": "STK Push sent to your phone. Please enter your M-Pesa PIN.",
    "transaction_reference": "TH12AB34CD",
    "checkout_request_id": "ws_CO_191220231234567890",
    "customer_message": "Success. Request accepted for processing"
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "Invalid phone number format",
    "transaction_reference": "TH12AB34CD"
}
```

### 2. Check Payment Status

**Endpoint:** `GET /api/payments/status/<transaction_reference>/`

**Example:** `GET /api/payments/status/TH12AB34CD/`

**Response:**
```json
{
    "id": "uuid",
    "transaction_reference": "TH12AB34CD",
    "amount": "100.00",
    "phone_number": "254708374149",
    "payment_method": "MPESA",
    "status": "COMPLETED",
    "mpesa_receipt_number": "QGR1234567",
    "result_code": "0",
    "result_description": "The service request is processed successfully.",
    "is_successful": true,
    "is_pending": false,
    "is_failed": false,
    "created_at": "2023-12-19T10:30:00Z",
    "updated_at": "2023-12-19T10:31:00Z",
    "completed_at": "2023-12-19T10:31:00Z"
}
```

### 3. M-Pesa Callback (Internal - Called by Safaricom)

**Endpoint:** `POST /api/payments/mpesa/callback/`

This endpoint receives callbacks from Safaricom. You don't call it directly, but you can monitor it in ngrok logs.

### 4. List Transactions (Requires Authentication)

**Endpoint:** `GET /api/payments/transactions/`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "transaction_reference": "TH12AB34CD",
            "event_title": "Music Festival 2024",
            "booking_reference": null,
            "amount": "100.00",
            "phone_number": "254708374149",
            "payment_method": "MPESA",
            "status": "COMPLETED",
            "mpesa_receipt_number": "QGR1234567",
            "created_at": "2023-12-19T10:30:00Z"
        }
    ]
}
```

## Testing Workflow

### Step-by-Step Testing

#### 1. Create a Test Event (If needed)

First, ensure you have a published event to test with:

```bash
# Login to get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-organizer@email.com",
    "password": "your-password"
  }'
```

Save the `access` token from the response.

#### 2. Initiate Payment

```bash
curl -X POST http://localhost:8000/api/payments/mpesa/initiate/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "your-event-uuid",
    "phone_number": "254708374149",
    "amount": 100.00,
    "account_reference": "TEST_001",
    "transaction_desc": "Test Payment"
  }'
```

**Expected Result:**
- You should receive a success response with a `transaction_reference`
- In **sandbox mode**, no actual STK Push is sent to the phone
- The transaction is created with status `PENDING`

#### 3. Simulate Callback (For Sandbox Testing)

Since sandbox doesn't send real STK Push or callbacks, you can manually simulate a callback:

```bash
curl -X POST http://localhost:8000/api/payments/mpesa/callback/ \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-merchant-id",
        "CheckoutRequestID": "ws_CO_test12345",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            {
              "Name": "Amount",
              "Value": 100
            },
            {
              "Name": "MpesaReceiptNumber",
              "Value": "QGR1234567"
            },
            {
              "Name": "TransactionDate",
              "Value": 20231219103000
            },
            {
              "Name": "PhoneNumber",
              "Value": 254708374149
            }
          ]
        }
      }
    }
  }'
```

**Note:** Replace `CheckoutRequestID` with the actual value from step 2.

#### 4. Check Payment Status

```bash
curl http://localhost:8000/api/payments/status/TH12AB34CD/
```

Replace `TH12AB34CD` with your actual transaction reference.

**Expected Result:**
- Status should be `COMPLETED`
- `mpesa_receipt_number` should be populated
- `completed_at` timestamp should be set

## Testing Scenarios

### Scenario 1: Successful Payment

1. Initiate payment with valid details
2. Transaction created with status `PENDING`
3. Callback received with `ResultCode: 0`
4. Transaction updated to `COMPLETED`
5. Receipt number saved

### Scenario 2: Failed Payment (User Cancelled)

1. Initiate payment
2. Simulate callback with `ResultCode: 1032` (Cancelled by user)
```json
{
  "Body": {
    "stkCallback": {
      "ResultCode": 1032,
      "ResultDesc": "Request cancelled by user"
    }
  }
}
```
3. Transaction marked as `FAILED`

### Scenario 3: Insufficient Funds

1. Initiate payment
2. Simulate callback with `ResultCode: 1` (Insufficient funds)
3. Transaction marked as `FAILED`

### Scenario 4: Invalid Phone Number

1. Initiate payment with invalid phone: `"12345"`
2. Should receive error: `"Invalid phone number format"`
3. No transaction created

### Scenario 5: Payment Timeout

1. Initiate payment
2. No callback received within 5 minutes
3. Celery task `check_pending_transactions` runs
4. Queries M-Pesa for status
5. Updates transaction accordingly

## Common M-Pesa Result Codes

| Code | Description |
|------|-------------|
| 0    | Success |
| 1    | Insufficient funds |
| 1032 | Request cancelled by user |
| 1037 | Timeout - User did not enter PIN |
| 2001 | Invalid M-Pesa PIN |
| 1025 | Unable to complete transaction |
| 1019 | Transaction expired |

## Monitoring & Debugging

### View Django Logs
```bash
tail -f logs/django.log
```

### View Celery Logs
Celery worker console will show async task execution

### View ngrok Requests
Access ngrok dashboard at: `http://127.0.0.1:4040`

You can see all incoming requests including M-Pesa callbacks.

### Check Redis Cache

```bash
redis-cli
> keys mpesa*
> get mpesa_access_token
```

### Django Admin

Access: `http://localhost:8000/admin/`

Navigate to **Payments > Transactions** to view all transactions with full details.

## Troubleshooting

### Issue: "Failed to generate access token"

**Solution:**
1. Check your Consumer Key and Secret are correct
2. Verify internet connection
3. Check Daraja API sandbox is online: https://sandbox.safaricom.co.ke

### Issue: "Callback not received"

**Solutions:**
1. Verify ngrok is running and URL is updated in `.env`
2. Check ngrok dashboard for incoming requests
3. Ensure callback URL is publicly accessible
4. Restart Django server after changing `.env`

### Issue: "Transaction stuck in PENDING"

**Solutions:**
1. Manually query status: `GET /api/payments/status/<reference>/`
2. Wait for Celery Beat task to run (checks every 5 minutes)
3. Simulate callback manually for testing

### Issue: "Redis connection error"

**Solution:**
1. Ensure Redis is running: `redis-cli ping`
2. Check Redis URL in `.env`: `REDIS_URL=redis://localhost:6379/0`

## Next Steps

### For Production Deployment

1. **Get Production Credentials:**
   - Apply for Go Live on Daraja Portal
   - Obtain production Consumer Key, Secret, Shortcode, Passkey

2. **Update Environment:**
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=<production-key>
   MPESA_CONSUMER_SECRET=<production-secret>
   MPESA_PASSKEY=<production-passkey>
   MPESA_SHORTCODE=<your-production-shortcode>
   MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/
   ```

3. **Setup Celery Beat** for periodic tasks:
   ```bash
   celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

4. **Configure Periodic Tasks** in Django Admin:
   - `check_pending_transactions` - Every 5 minutes
   - `cleanup_old_pending_transactions` - Daily

5. **Setup Monitoring:**
   - Sentry for error tracking
   - Datadog/New Relic for performance monitoring

## API Documentation

Full API documentation is available at:
- **Swagger UI:** http://localhost:8000/swagger/
- **ReDoc:** http://localhost:8000/redoc/

Look for the **Payments** section in the API documentation.

## Support

For issues with:
- **TukioHub Implementation:** Check logs and this guide
- **Daraja API:** https://developer.safaricom.co.ke/support
- **Sandbox Issues:** Contact Safaricom Developer Support

---

**Last Updated:** December 19, 2024
**Sprint:** 10 - M-Pesa Integration
**Status:** ✅ Complete and Ready for Testing

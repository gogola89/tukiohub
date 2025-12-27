# Wallet Payment System - Frontend Integration Guide

## Overview

TukioHub supports **wallet-based payments** for registered attendees. This allows attendees to:
- Top up their wallet balance
- Pay for event bookings using wallet funds
- View transaction history
- Receive refunds to their wallet

This guide covers all wallet endpoints and the complete payment flow.

## Wallet Endpoints

### 1. Get Wallet Balance & Transactions

**Endpoint**: `GET /api/attendees/wallet/`
**Auth Required**: Yes (Attendee JWT token)

**Response**:
```json
{
  "wallet_balance": "1500.00",
  "recent_transactions": [
    {
      "id": "uuid",
      "transaction_type": "DEPOSIT",
      "amount": "1000.00",
      "description": "Wallet deposit",
      "created_at": "2025-12-27T10:00:00Z",
      "booking": null
    },
    {
      "id": "uuid",
      "transaction_type": "BOOKING",
      "amount": "500.00",
      "description": "Payment for booking BKG123456",
      "created_at": "2025-12-27T11:00:00Z",
      "booking": "booking-uuid"
    }
  ]
}
```

**Transaction Types**:
- `DEPOSIT` - Money added to wallet
- `WITHDRAWAL` - Money withdrawn from wallet
- `BOOKING` - Payment for event booking
- `REFUND` - Refund from cancelled booking
- `PROMO_CREDIT` - Promotional credit

### 2. Add Money to Wallet (via M-Pesa)

**Endpoint**: `POST /api/attendees/wallet/`
**Auth Required**: Yes (Attendee JWT token)

**Request**:
```json
{
  "amount": 1000.00,
  "phone_number": "254712345678",  // Optional - defaults to attendee's phone
  "description": "Top up wallet"  // Optional
}
```

**Response**:
```json
{
  "message": "M-Pesa payment initiated. Please enter your PIN on your phone.",
  "transaction_reference": "WT12345678",
  "checkout_request_id": "ws_CO_191125...",
  "wallet_balance": "1500.00"
}
```

**What Happens**:
1. Backend creates a pending Transaction record with type `WALLET_TOPUP`
2. M-Pesa STK Push is sent to the provided phone number
3. User enters M-Pesa PIN on their phone
4. M-Pesa sends callback to backend
5. Backend processes callback and adds money to wallet
6. Frontend can check transaction status using the `transaction_reference`

**Check Payment Status**:
```bash
GET /api/payments/status/{transaction_reference}/
```

**Response**:
```json
{
  "transaction_reference": "WT12345678",
  "status": "COMPLETED",  // or "PENDING", "FAILED"
  "amount": "1000.00",
  "mpesa_receipt_number": "QJK8H7M6N5",
  "created_at": "2025-12-27T12:00:00Z",
  "completed_at": "2025-12-27T12:00:45Z"
}
```

**Note**: After successful payment, money is automatically added to the wallet. The frontend should poll the status endpoint or implement real-time updates to show the updated balance.

## Wallet Payment Flow

### Step 1: Create Booking with Wallet Payment

**Endpoint**: `POST /api/bookings/create/`
**Auth Required**: No (but attendee_id required for wallet payments)

**Request**:
```json
{
  "event_id": "event-uuid",
  "attendee_id": "attendee-uuid",  // REQUIRED for wallet payments
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "254712345678",
  "payment_method": "WALLET",  // Set to WALLET
  "items": [
    {
      "ticket_type_id": "ticket-type-uuid",
      "quantity": 2
    }
  ],
  "addons": [
    {
      "addon_id": "addon-uuid",
      "quantity": 1
    }
  ],
  "promo_code": "SAVE20",  // Optional
  "notes": "Special requirements"  // Optional
}
```

**Response**:
```json
{
  "id": "booking-uuid",
  "booking_reference": "BKG123456",
  "event": {...},
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "254712345678",
  "items": [...],
  "addon_items": [...],
  "total_amount": "3000.00",
  "discount_amount": "600.00",
  "final_amount": "2400.00",
  "payment_method": "WALLET",
  "payment_status": "PENDING",
  "status": "PENDING",
  "expires_at": "2025-12-27T12:05:00Z",  // 5 minutes from creation
  "created_at": "2025-12-27T12:00:00Z"
}
```

**Important Notes**:
- Booking is created with status `PENDING`
- Wallet balance is checked but NOT deducted yet
- You must confirm payment within 5 minutes or booking expires
- If insufficient wallet balance, request will fail with error message

**Error Responses**:

```json
// Insufficient balance
{
  "error": "Insufficient funds in wallet. Required: 2400.00, Available: 1500.00"
}

// Missing attendee_id
{
  "error": "Attendee ID is required when using wallet payment"
}
```

### Step 2: Confirm Wallet Payment

**Endpoint**: `POST /api/bookings/<booking_reference>/confirm-wallet-payment/`
**Auth Required**: Yes (Attendee JWT token)

**Request**: Empty body (no parameters needed)

**Response**:
```json
{
  "message": "Payment confirmed successfully",
  "booking": {
    "id": "booking-uuid",
    "booking_reference": "BKG123456",
    "payment_status": "COMPLETED",
    "status": "CONFIRMED",
    "final_amount": "2400.00",
    "confirmed_at": "2025-12-27T12:01:00Z",
    "tickets": [
      {
        "id": "ticket-uuid",
        "ticket_code": "TKGH7D9K2M",
        "ticket_type": {...},
        "status": "ACTIVE"
      },
      ...
    ]
  },
  "tickets_generated": 2
}
```

**What Happens**:
1. ✅ Booking ownership verified (must belong to authenticated attendee)
2. ✅ Wallet balance deducted (`final_amount` withdrawn)
3. ✅ Wallet transaction created (type: `BOOKING`)
4. ✅ Booking status changed to `CONFIRMED`
5. ✅ Tickets generated with QR codes
6. ✅ Confirmation email sent with tickets attached

**Error Responses**:

```json
// Insufficient balance (if balance changed after booking creation)
{
  "error": "Insufficient funds. Required: 2400.00, Available: 1000.00"
}

// Booking expired
{
  "error": "Booking has expired"
}

// Not authorized
{
  "error": "You are not authorized to confirm this booking"
}

// Wrong payment method
{
  "error": "This endpoint is only for wallet payments"
}
```

### Step 3: View Updated Wallet Balance

After payment confirmation, fetch the updated wallet balance:

**Endpoint**: `GET /api/attendees/wallet/`

**Response**:
```json
{
  "wallet_balance": "100.00",  // 1500.00 - 2400.00 + refund if any
  "recent_transactions": [
    {
      "id": "uuid",
      "transaction_type": "BOOKING",
      "amount": "2400.00",
      "description": "Payment for booking BKG123456",
      "created_at": "2025-12-27T12:01:00Z",
      "booking": "booking-uuid"
    },
    ...
  ]
}
```

## Frontend Implementation Example

### React/TypeScript Example

```typescript
// 1. Check wallet balance before booking
async function getWalletBalance() {
  const response = await fetch('/api/attendees/wallet/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return data.wallet_balance;
}

// 1b. Add money to wallet via M-Pesa
async function addMoneyToWallet(amount, phoneNumber) {
  const response = await fetch('/api/attendees/wallet/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      phone_number: phoneNumber,
      description: 'Wallet top-up',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to initiate payment');
  }

  return await response.json();
}

// 1c. Check payment status
async function checkPaymentStatus(transactionReference) {
  const response = await fetch(`/api/payments/status/${transactionReference}/`);
  const data = await response.json();
  return data;
}

// 1d. Wait for payment completion (polling)
async function waitForPaymentCompletion(transactionReference, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(transactionReference);

    if (status.status === 'COMPLETED') {
      return { success: true, status };
    } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      return { success: false, status };
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false, error: 'Payment timeout' };
}

// 2. Create booking with wallet payment
async function createBookingWithWallet(bookingData) {
  const response = await fetch('/api/bookings/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...bookingData,
      attendee_id: currentUser.id,  // Required for wallet payments
      payment_method: 'WALLET',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Booking failed');
  }

  return await response.json();
}

// 3. Confirm wallet payment
async function confirmWalletPayment(bookingReference) {
  const response = await fetch(
    `/api/bookings/${bookingReference}/confirm-wallet-payment/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Payment confirmation failed');
  }

  return await response.json();
}

// Complete wallet top-up flow
async function topUpWallet(amount, phoneNumber) {
  try {
    // 1. Initiate M-Pesa payment
    const paymentResult = await addMoneyToWallet(amount, phoneNumber);
    console.log(`M-Pesa initiated: ${paymentResult.transaction_reference}`);

    // Show "Enter M-Pesa PIN" message to user
    showPaymentPendingDialog(paymentResult.transaction_reference);

    // 2. Wait for payment completion (poll status)
    const result = await waitForPaymentCompletion(paymentResult.transaction_reference);

    if (result.success) {
      console.log(`Payment successful! Receipt: ${result.status.mpesa_receipt_number}`);

      // 3. Refresh wallet balance
      const newBalance = await getWalletBalance();
      console.log(`New wallet balance: ${newBalance}`);

      // Show success message
      showSuccessMessage(`KES ${amount} added to wallet`);
      return { success: true, newBalance };
    } else {
      console.error('Payment failed:', result.error || result.status.result_description);
      showErrorMessage('Payment failed. Please try again.');
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Wallet top-up error:', error.message);
    showErrorMessage(error.message);
    throw error;
  }
}

// Complete booking flow
async function bookEventWithWallet(eventData) {
  try:
    // 1. Check wallet balance
    const balance = await getWalletBalance();
    console.log(`Wallet balance: ${balance}`);

    // 2. Create booking
    const booking = await createBookingWithWallet(eventData);
    console.log(`Booking created: ${booking.booking_reference}`);
    console.log(`Amount: ${booking.final_amount}`);

    // Show confirmation dialog to user
    const confirmed = await showPaymentConfirmation({
      amount: booking.final_amount,
      balance: balance,
      newBalance: balance - booking.final_amount,
    });

    if (!confirmed) {
      // User cancelled - booking will expire automatically
      return { cancelled: true };
    }

    // 3. Confirm payment
    const result = await confirmWalletPayment(booking.booking_reference);
    console.log(`Payment confirmed! Tickets: ${result.tickets_generated}`);

    // 4. Navigate to success page or show tickets
    return {
      success: true,
      booking: result.booking,
      tickets: result.booking.tickets,
    };

  } catch (error) {
    console.error('Booking error:', error.message);

    // Handle specific errors
    if (error.message.includes('Insufficient funds')) {
      // Show "Top up wallet" option
      showTopUpDialog();
    }

    throw error;
  }
}
```

### UI Flow Example

```
┌─────────────────────────────┐
│   Event Page                │
│                             │
│   Price: KES 2,400          │
│                             │
│   Payment Method:           │
│   ○ M-Pesa                  │
│   ● Wallet (KES 1,500)      │
│                             │
│   [Book Now]                │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Payment Confirmation      │
│                             │
│   Booking Amount: 2,400     │
│   Wallet Balance: 1,500     │
│   ⚠️ Insufficient Balance   │
│                             │
│   [Top Up Wallet]           │
│   [Cancel]                  │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Top Up Wallet             │
│                             │
│   Amount Needed: 900        │
│   Suggested: 1,000          │
│                             │
│   Enter Amount: [1000    ]  │
│   Phone: [254712345678   ]  │
│                             │
│   [Pay with M-Pesa]         │
│   [Cancel]                  │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   M-Pesa Payment Pending    │
│                             │
│   📱 Check your phone       │
│   Enter M-Pesa PIN          │
│                             │
│   Amount: KES 1,000         │
│   Ref: WT12345678           │
│                             │
│   [⏳ Waiting for payment...]│
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Payment Successful! ✓     │
│                             │
│   Amount Added: KES 1,000   │
│   Receipt: QJK8H7M6N5       │
│                             │
│   New Balance: KES 2,500    │
│                             │
│   [Continue to Booking]     │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Payment Confirmation      │
│                             │
│   Booking Amount: 2,400     │
│   Current Balance: 2,500    │
│   New Balance: 100          │
│                             │
│   [Confirm Payment]         │
│   [Cancel]                  │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│   Success! ✓                │
│                             │
│   Booking Confirmed         │
│   Reference: BKG123456      │
│   Tickets: 2                │
│                             │
│   Wallet Balance: KES 100   │
│                             │
│   [View Tickets]            │
│   [Download PDF]            │
└─────────────────────────────┘
```

## Wallet Refunds (Cancellations)

When a booking paid with wallet is cancelled, the amount is automatically refunded to the wallet.

**Endpoint**: `POST /api/bookings/<booking_reference>/cancel/`

**Request**:
```json
{
  "reason": "Changed plans"  // Optional
}
```

**Response**:
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "booking-uuid",
    "booking_reference": "BKG123456",
    "status": "CANCELLED",
    "payment_method": "WALLET",
    ...
  }
}
```

**What Happens**:
1. ✅ Booking status changed to `CANCELLED`
2. ✅ Inventory released
3. ✅ Amount refunded to wallet (for confirmed bookings)
4. ✅ Wallet transaction created (type: `REFUND`)
5. ✅ Refund email sent

**Check Wallet After Cancellation**:
```bash
GET /api/attendees/wallet/
```

You'll see a `REFUND` transaction and increased balance.

## Best Practices

### 1. **Always Check Balance First**
```javascript
const balance = await getWalletBalance();
if (balance < bookingAmount) {
  showTopUpPrompt(bookingAmount - balance);
}
```

### 2. **Handle Insufficient Balance Gracefully**
```javascript
try {
  await createBookingWithWallet(data);
} catch (error) {
  if (error.message.includes('Insufficient funds')) {
    const needed = extractAmountFromError(error.message);
    navigateToTopUp(needed);
  }
}
```

### 3. **Show Balance Updates in Real-Time**
After any wallet transaction, refresh the balance:
```javascript
await confirmWalletPayment(bookingRef);
await getWalletBalance();  // Update UI
```

### 4. **Implement Booking Timeout Warning**
Bookings expire in 5 minutes. Show a countdown timer:
```javascript
const expiresAt = new Date(booking.expires_at);
const countdown = setInterval(() => {
  const remaining = expiresAt - new Date();
  if (remaining <= 0) {
    alert('Booking expired!');
    clearInterval(countdown);
  }
  updateCountdownUI(remaining);
}, 1000);
```

### 5. **Confirm Payment Immediately**
Don't delay wallet payment confirmation - users expect instant confirmation since it's their own funds.

## Testing Wallet Payments

### Test Scenario 1: Successful Payment

```bash
# 1. Register attendee and login
curl -X POST /api/attendees/register/ -d '{...}'

# 2. Add money to wallet via M-Pesa
curl -X POST /api/attendees/wallet/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "phone_number": "254712345678",
    "description": "Test wallet top-up"
  }'

# 3. Enter M-Pesa PIN on your phone
# Save the transaction_reference from response

# 4. Check payment status (poll until COMPLETED)
curl -X GET /api/payments/status/WT12345678/

# 5. Check updated balance (after payment completes)
curl -X GET /api/attendees/wallet/ \
  -H "Authorization: Bearer TOKEN"

# 6. Create booking
curl -X POST /api/bookings/create/ \
  -d '{
    "event_id": "...",
    "attendee_id": "...",
    "payment_method": "WALLET",
    ...
  }'

# 7. Confirm payment
curl -X POST /api/bookings/BKG123456/confirm-wallet-payment/ \
  -H "Authorization: Bearer TOKEN"

# 8. Check updated balance
curl -X GET /api/attendees/wallet/ \
  -H "Authorization: Bearer TOKEN"
```

### Test Scenario 2: Insufficient Balance

```bash
# Create booking with wallet but insufficient balance
curl -X POST /api/bookings/create/ \
  -d '{
    "payment_method": "WALLET",
    "attendee_id": "...",
    ...
  }'

# Expected: 400 error with message about insufficient funds
```

### Test Scenario 3: Refund

```bash
# Cancel a confirmed wallet booking
curl -X POST /api/bookings/BKG123456/cancel/ \
  -d '{"reason": "Test refund"}'

# Check wallet - should see refund transaction
curl -X GET /api/attendees/wallet/ \
  -H "Authorization: Bearer TOKEN"
```

## Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/attendees/wallet/` | GET | Yes | Get balance & transactions |
| `/api/attendees/wallet/` | POST | Yes | Add money to wallet via M-Pesa |
| `/api/payments/status/<ref>/` | GET | No | Check M-Pesa payment status |
| `/api/bookings/create/` | POST | No | Create booking (set payment_method='WALLET') |
| `/api/bookings/<ref>/confirm-wallet-payment/` | POST | Yes | Confirm wallet payment & complete booking |
| `/api/bookings/<ref>/cancel/` | POST | No | Cancel booking (auto-refund for wallet) |
| `/api/bookings/<ref>/` | GET | No | Get booking details |

## Security Notes

✅ **Wallet payments require authenticated attendee**
✅ **Only booking owner can confirm payment**
✅ **Balance is checked before booking creation**
✅ **Balance is deducted atomically during confirmation**
✅ **Transaction records created for audit trail**
✅ **Automatic refunds for cancellations**

## Migration from M-Pesa

If you want to migrate an M-Pesa user to wallet:
1. Add money to wallet via M-Pesa deposit
2. Use wallet for future bookings
3. Enjoy instant confirmation (no STK Push wait time)

## Future Enhancements

- [ ] Wallet-to-wallet transfers
- [ ] Wallet withdrawal to M-Pesa
- [ ] Wallet transaction export (CSV/PDF)
- [ ] Wallet top-up via card
- [ ] Automatic wallet top-up (set minimum balance)
- [ ] Wallet loyalty/rewards program

---

## Quick Reference

**Wallet Payment Flow**:
```
Check Balance → Create Booking (WALLET) → Confirm Payment → Tickets Generated
```

**Required for Wallet Payments**:
- Attendee must be registered and logged in
- `attendee_id` must be provided in booking
- `payment_method` must be set to `'WALLET'`
- Sufficient wallet balance

**Key Differences from M-Pesa**:
- No STK Push (instant)
- No waiting for callback
- Must confirm payment explicitly
- Immediate refunds on cancellation

---

**Need Help?** Check the complete API documentation at `/swagger/` or `/redoc/`

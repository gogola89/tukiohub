# Wallet Payment System - Summary

## ✅ What's Ready for Frontend Implementation

The wallet payment system is **fully implemented and ready** for frontend integration.

### New Endpoint Added

**Confirm Wallet Payment**
```
POST /api/bookings/<booking_reference>/confirm-wallet-payment/
```

This endpoint was missing - I've added it to complete the wallet payment flow.

## How Wallet Payments Work

### Flow Overview

```
1. Attendee Logs In
   ↓
2. Check Wallet Balance
   GET /api/attendees/wallet/
   ↓
3. Create Booking with payment_method='WALLET'
   POST /api/bookings/create/
   ↓
4. Confirm Payment (NEW ENDPOINT)
   POST /api/bookings/<ref>/confirm-wallet-payment/
   ↓
5. Wallet Deducted, Tickets Generated ✓
```

### Key Differences from M-Pesa

| Feature | M-Pesa | Wallet |
|---------|--------|--------|
| **Speed** | 10-30 seconds (STK Push) | Instant |
| **Steps** | 1. Create booking<br>2. Initiate M-Pesa<br>3. User enters PIN<br>4. Callback confirms | 1. Create booking<br>2. Confirm payment |
| **Auth Required** | No | Yes (attendee must be logged in) |
| **Refunds** | Complex (manual M-Pesa refund) | Instant (back to wallet) |

## Available Wallet Endpoints

### 1. View Wallet

```bash
GET /api/attendees/wallet/
Authorization: Bearer {attendee_token}
```

**Response:**
```json
{
  "wallet_balance": "1500.00",
  "recent_transactions": [...]
}
```

### 2. Add Money to Wallet (via M-Pesa)

```bash
POST /api/attendees/wallet/
Authorization: Bearer {attendee_token}

{
  "amount": 1000.00,
  "phone_number": "254712345678",  // optional - defaults to attendee's phone
  "description": "Top up"  // optional
}
```

**Response:**
```json
{
  "message": "M-Pesa payment initiated. Please enter your PIN on your phone.",
  "transaction_reference": "WT12345678",
  "checkout_request_id": "ws_CO_...",
  "wallet_balance": "1500.00"
}
```

**Note:** This initiates M-Pesa STK Push. Money is added to wallet after successful payment confirmation via M-Pesa callback.

### 3. Create Booking (Wallet Payment)

```bash
POST /api/bookings/create/

{
  "event_id": "...",
  "attendee_id": "...",  // REQUIRED for wallet
  "payment_method": "WALLET",
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "254712345678",
  "items": [{
    "ticket_type_id": "...",
    "quantity": 2
  }]
}
```

**Checks performed:**
- ✓ Wallet balance sufficient
- ✓ Attendee exists
- ✓ Creates PENDING booking

### 4. Confirm Wallet Payment (NEW!)

```bash
POST /api/bookings/BKG123456/confirm-wallet-payment/
Authorization: Bearer {attendee_token}
```

**What happens:**
1. ✓ Verifies booking belongs to authenticated attendee
2. ✓ Deducts amount from wallet
3. ✓ Creates wallet transaction record
4. ✓ Confirms booking
5. ✓ Generates tickets with QR codes
6. ✓ Sends confirmation email

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "booking": {...},
  "tickets_generated": 2
}
```

## Frontend Implementation Checklist

### Required UI Components

- [ ] **Wallet Balance Display**
  - Show current balance
  - Update after transactions
  - "Top Up" button

- [ ] **Payment Method Selection**
  - Radio buttons: M-Pesa / Wallet
  - Disable wallet if insufficient balance
  - Show balance when wallet selected

- [ ] **Wallet Top-Up Modal**
  - Amount input
  - Payment method (M-Pesa/Card)
  - Success/error handling

- [ ] **Payment Confirmation Dialog**
  - Show: Amount, Current Balance, New Balance
  - "Confirm Payment" button
  - "Cancel" option

- [ ] **Transaction History Page**
  - List all transactions
  - Filter by type (Deposits, Bookings, Refunds)
  - Export option (future)

### Code Example (React)

```jsx
// 1. Wallet balance component
function WalletBalance() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch('/api/attendees/wallet/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setBalance(data.wallet_balance));
  }, []);

  return (
    <div>
      Wallet Balance: KES {balance}
      <button onClick={() => navigate('/topup')}>Top Up</button>
    </div>
  );
}

// 2. Payment method selection
function PaymentMethodSelector({ bookingAmount, onSelect }) {
  const { balance } = useWallet();
  const canUseWallet = balance >= bookingAmount;

  return (
    <div>
      <label>
        <input type="radio" value="MPESA" onChange={e => onSelect(e.target.value)} />
        M-Pesa
      </label>
      <label>
        <input
          type="radio"
          value="WALLET"
          onChange={e => onSelect(e.target.value)}
          disabled={!canUseWallet}
        />
        Wallet (KES {balance})
        {!canUseWallet && <span>Insufficient balance</span>}
      </label>
    </div>
  );
}

// 3. Confirm wallet payment
async function confirmWalletPayment(bookingRef) {
  const res = await fetch(`/api/bookings/${bookingRef}/confirm-wallet-payment/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return await res.json();
}
```

## Testing Guide

### Test Wallet Payment Flow

```bash
# 1. Register and login as attendee
curl -X POST /api/attendees/register/ \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "password2": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "phone_number": "254712345678"
  }'

# Save the access token from response

# 2. Add money to wallet (via M-Pesa)
curl -X POST /api/attendees/wallet/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "phone_number": "254712345678",
    "description": "Test top-up"
  }'

# This will initiate M-Pesa STK Push
# Enter your M-Pesa PIN on your phone
# Save the transaction_reference from response

# 3. Check balance
curl -X GET /api/attendees/wallet/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Create booking with wallet payment
curl -X POST /api/bookings/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "YOUR_EVENT_ID",
    "attendee_id": "YOUR_ATTENDEE_ID",
    "payment_method": "WALLET",
    "attendee_name": "Test User",
    "attendee_email": "test@example.com",
    "attendee_phone": "254712345678",
    "items": [{
      "ticket_type_id": "YOUR_TICKET_TYPE_ID",
      "quantity": 1
    }]
  }'

# Save the booking_reference from response

# 5. Confirm wallet payment
curl -X POST /api/bookings/YOUR_BOOKING_REF/confirm-wallet-payment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 6. Check updated wallet balance
curl -X GET /api/attendees/wallet/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Common Errors

**Insufficient Balance**
```json
{
  "error": "Insufficient funds in wallet. Required: 2400.00, Available: 1500.00"
}
```
→ Show "Top Up Wallet" button

**Booking Expired**
```json
{
  "error": "Booking has expired"
}
```
→ Redirect to event page, show "Book again" message

**Not Authorized**
```json
{
  "error": "You are not authorized to confirm this booking"
}
```
→ User logged in as different attendee, show login prompt

**Missing Attendee ID**
```json
{
  "error": "Attendee ID is required when using wallet payment"
}
```
→ Prompt user to login/register

## What Was Added

### New Code Files
- `/api/bookings/<ref>/confirm-wallet-payment/` endpoint

### Modified Files
- `apps/bookings/views.py` - Added `ConfirmWalletPaymentAPIView`
- `apps/bookings/urls.py` - Added URL route

### Existing (Already Working)
- `apps/users/models.py` - Attendee wallet fields
- `apps/users/views.py` - Wallet balance & top-up endpoints
- `apps/bookings/services.py` - Wallet payment logic
- `apps/bookings/models.py` - WALLET payment method

## Documentation

📄 **Complete Guide**: `WALLET_PAYMENT_GUIDE.md`
- All endpoints documented
- Request/response examples
- Frontend code examples
- Error handling
- Best practices
- Testing scenarios

## Next Steps for Frontend

1. **Implement wallet UI components** (balance display, top-up, payment selection)
2. **Update booking flow** to support wallet payment method
3. **Add confirmation dialog** before wallet payment
4. **Show real-time balance updates**
5. **Handle errors gracefully** (insufficient balance, etc.)
6. **Test complete flow** end-to-end

## Production Considerations

### Wallet Top-Up Integration ✅

The wallet top-up endpoint now uses **M-Pesa STK Push** for secure payments:

**How it works:**
1. Frontend calls `POST /api/attendees/wallet/` with amount and phone number
2. Backend initiates M-Pesa STK Push and creates pending Transaction
3. User enters M-Pesa PIN on their phone
4. M-Pesa sends callback to backend
5. Backend processes callback and adds money to wallet
6. Wallet balance is updated automatically

**Transaction Flow:**
```python
# 1. User initiates top-up (apps/users/views.py - WalletView.post())
transaction = Transaction.objects.create(
    attendee=attendee,
    amount=amount,
    transaction_reference=f"WT{uuid}",
    metadata={'transaction_type': 'WALLET_TOPUP'}
)
mpesa_service.initiate_stk_push(...)

# 2. M-Pesa callback received (apps/payments/views.py - MpesaCallbackAPIView)
# Transaction marked as COMPLETED

# 3. Celery task processes payment (apps/payments/tasks.py - process_successful_payment)
if transaction.attendee and not transaction.booking:
    attendee.add_to_wallet(amount)  # Money added to wallet
```

**For card payments:** You can add Stripe/Flutterwave support by creating similar flow in a separate endpoint.

### Security

✅ All wallet operations require authentication
✅ Booking ownership verified before payment confirmation
✅ Atomic database transactions prevent race conditions
✅ Wallet balance checked before and during confirmation
✅ Full audit trail via WalletTransaction records

## Summary

🎉 **Wallet payments are fully functional!**

✅ **Wallet management** - Balance, transactions, top-up
✅ **Wallet bookings** - Create with WALLET payment method
✅ **Wallet confirmation** - New endpoint added
✅ **Wallet refunds** - Automatic on cancellation
✅ **Transaction history** - Full audit trail
✅ **Documentation** - Complete frontend guide

The backend is ready. The frontend team can now implement the wallet payment UI!

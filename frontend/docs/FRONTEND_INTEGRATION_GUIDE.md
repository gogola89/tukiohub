# Frontend Integration Guide: Attendee Management System

## Overview

This document provides instructions for frontend implementors to integrate the new attendee management features into the TukioHub platform. The system now supports two distinct user types: Organizers (event managers) and Attendees (event participants).

## New System Architecture

The system now separates user functionality:

1. **Organizers** - Event organizers who manage events (existing functionality)
2. **Attendees** - System users who can register, book events, track bookings, and use wallets

## New API Endpoints

### Attendee Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendees/register/` | POST | Register new attendee |
| `/api/attendees/login/` | POST | Login attendee |
| `/api/attendees/logout/` | POST | Logout attendee |
| `/api/attendees/profile/` | GET/PUT/PATCH | Get/update attendee profile |

### Wallet Functionality

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendees/wallet/` | GET | Get wallet balance and transactions |
| `/api/attendees/wallet/` | POST | Add money to wallet |

### Admin Attendee Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/attendees/` | GET | List all attendees (admin only) |
| `/api/admin/attendees/<id>/` | GET/PATCH | Get/update attendee details (admin only) |

### Booking with Registered Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bookings/create/` | POST | Create booking with support for `attendee_id` and `payment_method` |

## Changes to Booking Flow

### For Guest Checkout (Existing)

```json
{
  "event_id": "uuid",
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "+254712345678",
  "items": [{"ticket_type_id": "uuid", "quantity": 2}],
  "payment_method": "MPESA"  // or "CARD"
}
```

### For Registered Users

```json
{
  "event_id": "uuid",
  "attendee_id": "uuid",  // ID of registered attendee
  "attendee_name": "John Doe",  // Still required for ticket info
  "attendee_email": "john@example.com",
  "attendee_phone": "+254712345678",
  "items": [{"ticket_type_id": "uuid", "quantity": 2}],
  "payment_method": "WALLET",  // or "MPESA" or "CARD"
  "promo_code": "",  // Optional
  "notes": "Booking notes"  // Optional
}
```

## New Wallet Features

### Wallet Functionality
- Attendees can add money to their wallet
- Wallet payments are processed immediately when booking
- Refunds are automatically credited back to the wallet
- Wallet transaction history is available

### Wallet Transaction Types
- `DEPOSIT` - Adding money to wallet
- `WITHDRAWAL` - Withdrawing money from wallet
- `BOOKING` - Payment for bookings
- `REFUND` - Refund from cancelled bookings
- `PROMO_CREDIT` - Promotional credits

## JWT Authentication

### Attendee Authentication
- Use `/api/attendees/login/` for attendee authentication
- Returns JWT tokens (access and refresh)
- Attendee tokens are separate from organizer tokens

### Organizer Authentication
- Use `/api/auth/login/` for organizer authentication
- Returns JWT tokens (access and refresh)
- Maintains existing functionality

### Token Usage
- Both attendee and organizer tokens use the same Bearer authentication scheme
- Store tokens securely in frontend application
- Handle token refresh when needed

## Frontend Implementation Guide

### 1. Separate Registration Flows

#### Attendee Registration
- Create attendee registration form with:
  - First name
  - Last name
  - Email
  - Phone number
  - Password
  - Password confirmation
  - Newsletter subscription option

#### Organizer Registration
- Keep existing organizer registration form with:
  - Email
  - Password
  - Company name
  - Phone number
  - Password confirmation

### 2. Booking Flow Updates

#### Guest Checkout Option
- Maintain existing guest checkout flow
- No account required
- Process payment directly

#### Registered User Option
- Check if user is logged in as attendee
- If logged in, offer option to use their account
- Allow booking with wallet funds if available
- Show booking history for logged-in attendees

### 3. Wallet Integration

#### Wallet Balance Display
- Show wallet balance in attendee profile
- Display in booking flow when logged in
- Show transaction history

#### Wallet Funding
- Create form to add money to wallet
- Integrate with payment providers (M-Pesa, Card)
- Update balance immediately after successful funding

### 4. Profile Management

#### Attendee Profile
- Create attendee profile page
- Allow updating personal information
- Show booking history
- Show wallet balance and transactions

#### Organizer Profile
- Maintain existing organizer profile
- Allow updating business information
- Show event management features

### 5. Admin Dashboard Updates

#### Attendee Management
- Add attendee management section to admin dashboard
- List all attendees with search/filter options
- Show attendee statistics
- Allow admin to manage attendee accounts

## Migration Considerations

### Backward Compatibility
- Existing guest bookings continue to work
- No data migration needed for existing bookings
- All new features are additive

### User Migration
- New attendee accounts created by new users
- Existing bookings remain associated with guest information
- No disruption to existing functionality

## Error Handling

### Common Error Responses

#### Authentication Errors
```json
{
  "error": "Unable to log in with provided credentials."
}
```

#### Validation Errors
```json
{
  "password": ["Password fields didn't match."]
}
```

#### Wallet Errors
```json
{
  "error": "Insufficient funds in wallet. Required: 5000.00, Available: 2000.00"
}
```

## Testing Guidelines

### Attendee Registration
- Test successful registration flow
- Test validation errors
- Test duplicate email handling
- Test JWT token generation

### Attendee Login
- Test successful login
- Test invalid credentials
- Test account disabled state

### Wallet Functionality
- Test adding funds to wallet
- Test booking with wallet funds
- Test insufficient funds error
- Test transaction history display

### Booking Flow
- Test guest checkout (backward compatibility)
- Test registered user booking
- Test wallet payment option
- Test booking confirmation and ticket generation

## Security Considerations

### Data Protection
- Store JWT tokens securely in frontend
- Implement proper session management
- Validate all user inputs
- Protect sensitive attendee information

### Authentication
- Implement token refresh mechanisms
- Handle token expiration gracefully
- Secure all authenticated endpoints
- Implement proper logout functionality

## Performance Considerations

### Caching
- Cache frequently accessed attendee data
- Implement proper cache invalidation
- Optimize API responses for mobile usage

### Loading States
- Implement proper loading indicators
- Handle network errors gracefully
- Provide feedback during long operations

## Sample Implementation

### Attendee Registration Component
```javascript
// Example React component for attendee registration
const AttendeeRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password2: '',
    is_subscribed: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/attendees/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store tokens and redirect
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // Redirect to dashboard
      } else {
        const errors = await response.json();
        // Handle errors
      }
    } catch (error) {
      // Handle network errors
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Wallet Integration Component
```javascript
// Example React component for wallet integration
const WalletPayment = ({ bookingData, onPaymentSuccess }) => {
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Fetch wallet balance
    fetch('/api/attendees/wallet/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })
    .then(response => response.json())
    .then(data => setWalletBalance(data.wallet_balance));
  }, []);

  const handleBooking = async () => {
    const bookingPayload = {
      ...bookingData,
      payment_method: useWallet ? 'WALLET' : 'MPESA'
    };

    const response = await fetch('/api/bookings/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(bookingPayload)
    });

    if (response.ok) {
      onPaymentSuccess();
    } else {
      // Handle errors
    }
  };

  return (
    <div>
      {useWallet && walletBalance < bookingData.total_amount && (
        <div>Insufficient wallet balance</div>
      )}
      <button 
        onClick={() => setUseWallet(!useWallet)}
        disabled={walletBalance < bookingData.total_amount}
      >
        {useWallet ? 'Switch to M-Pesa' : 'Pay with Wallet'}
      </button>
      <button onClick={handleBooking}>Book Now</button>
    </div>
  );
};
```

## Support and Troubleshooting

### Common Issues

1. **JWT Token Issues**
   - Ensure proper token storage and retrieval
   - Handle token expiration with refresh mechanism
   - Clear tokens on logout

2. **Wallet Balance Not Updating**
   - Ensure proper API calls after wallet operations
   - Implement proper state management
   - Handle race conditions

3. **Booking Creation Failures**
   - Validate all required fields
   - Check attendee authentication status
   - Handle payment method validation

### Contact Information
- For technical issues: [Support Contact]
- For API questions: [Technical Contact]
- For feature requests: [Product Contact]

---

This guide provides comprehensive instructions for implementing the new attendee management features. If you have any questions or need clarification on any of the endpoints or functionality, please reach out to the backend development team.
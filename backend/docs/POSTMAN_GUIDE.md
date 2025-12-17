# TukioHub API - Postman Collection Guide

## Importing the Collection

1. Open Postman
2. Click **Import** button (top-left)
3. Select the file: `docs/TukioHub_API.postman_collection.json`
4. Click **Import**

## Collection Variables

The collection uses variables to make testing easier. They are automatically updated by scripts:

- `base_url`: Default is `http://localhost:8000` (you can change this for production)
- `access_token`: Automatically set after login
- `refresh_token`: Automatically set after login
- `event_id`: Automatically set when you create an event
- `ticket_type_id`: Automatically set when you create a ticket type
- `promo_code_id`: Automatically set when you create a promo code
- `addon_id`: Automatically set when you create an add-on

## Quick Start Guide

### 1. Setup & Authentication

**Step 1: Register an Organizer**
```
POST /api/auth/register/
```
- Navigate to: **Authentication > Register Organizer**
- Click **Send**
- Wait for email verification (check MailDev at http://localhost:8025)

**Step 2: Login**
```
POST /api/auth/login/
```
- Navigate to: **Authentication > Login**
- Update the email/password in the request body
- Click **Send**
- The `access_token` and `refresh_token` are automatically saved!

**Step 3: Verify Authentication**
```
GET /api/auth/me/
```
- Navigate to: **Authentication > Get Current User**
- Click **Send** to verify your token works

### 2. Create an Event

**Step 1: Create Event**
```
POST /api/events/
```
- Navigate to: **Organizer - Events > Create Event**
- Modify the request body as needed
- Click **Send**
- The `event_id` is automatically saved for use in other requests!

**Step 2: Add Ticket Types**
```
POST /api/events/{{event_id}}/tickets/
```
- Navigate to: **Organizer - Ticket Types > Create Ticket Type**
- Click **Send** to create a VIP ticket
- Try: **Create Regular Ticket** and **Create Early Bird Ticket**

**Step 3: Add Promo Code (Optional)**
```
POST /api/events/{{event_id}}/promo-codes/
```
- Navigate to: **Organizer - Promo Codes > Create Promo Code**
- Click **Send**

**Step 4: Publish Event**
```
POST /api/events/{{event_id}}/publish/
```
- Navigate to: **Organizer - Events > Publish Event**
- Click **Send**
- Note: Event must have at least one ticket type to publish

### 3. Test Public Endpoints (No Auth Required)

**Browse Events**
```
GET /api/public/events/
```
- Navigate to: **Public - Event Discovery > List Published Events**
- Note: The **Authorization** header is disabled for public endpoints
- Click **Send**

**Search Events**
```
GET /api/public/events/search/?q=Tech
```
- Navigate to: **Public - Event Discovery > Search Events**
- Modify the query parameters as needed
- Click **Send**

**Get Event Categories**
```
GET /api/public/events/categories/
```
- Navigate to: **Public - Event Discovery > Get Event Categories**
- Click **Send**

## Collection Organization

### 1. Authentication (4 requests)
- Register Organizer
- Login (auto-saves tokens)
- Refresh Token (auto-updates access_token)
- Get Current User

### 2. Organizer - Events (11 requests)
- CRUD operations for events
- Publish event
- Upload images
- Get statistics
- Filter and search

### 3. Organizer - Ticket Types (7 requests)
- CRUD operations for ticket types
- Examples for VIP, Regular, and Early Bird tickets

### 4. Organizer - Promo Codes (6 requests)
- CRUD operations for promo codes
- Examples for percentage and fixed discounts

### 5. Organizer - Event Add-ons (5 requests)
- CRUD operations for event add-ons

### 6. Public - Event Discovery (12 requests)
- List published events
- Get event by slug
- Search events
- Featured events
- Categories
- Nearby events (location-based)
- Upcoming events
- This weekend's events
- Various filters (date range, price, free events)

## Auto-Saving Variables

The collection includes **Test Scripts** that automatically save IDs for you:

**After Login:**
```javascript
var jsonData = pm.response.json();
pm.collectionVariables.set("access_token", jsonData.access);
pm.collectionVariables.set("refresh_token", jsonData.refresh);
```

**After Creating an Event:**
```javascript
var jsonData = pm.response.json();
if (jsonData.id) {
    pm.collectionVariables.set("event_id", jsonData.id);
}
```

This means you can create an event once, and all subsequent requests (tickets, promo codes, etc.) will automatically use that event's ID!

## Testing Workflow Example

Here's a complete testing workflow:

1. **Authentication > Login** ✅ (saves access_token)
2. **Organizer - Events > Create Event** ✅ (saves event_id)
3. **Organizer - Ticket Types > Create Ticket Type** ✅ (saves ticket_type_id)
4. **Organizer - Ticket Types > Create Regular Ticket** ✅
5. **Organizer - Promo Codes > Create Promo Code** ✅ (saves promo_code_id)
6. **Organizer - Events > Publish Event** ✅
7. **Public - Event Discovery > List Published Events** ✅ (no auth needed)
8. **Public - Event Discovery > Search Events** ✅

## Common Issues

### Issue: "Authentication credentials were not provided"
**Solution**: Make sure you've logged in first. The collection uses bearer token authentication, which is automatically applied to all requests that need it.

### Issue: "Event not found"
**Solution**: Make sure you've created an event first. The `{{event_id}}` variable is set automatically when you create an event.

### Issue: Variables not updating
**Solution**: Check the **Tests** tab of the request. Scripts should be updating variables automatically. If not, you can manually set them:
- Click the collection name
- Go to **Variables** tab
- Update the **Current Value** column

### Issue: Public endpoints returning 401
**Solution**: Public endpoints shouldn't require authentication. Check that the request has **Auth Type** set to **"No Auth"** (not inheriting from parent).

## Useful Tips

1. **Use Environment for Multiple Setups**: Create separate environments for local, staging, and production with different `base_url` values.

2. **Organize Your Events**: After creating multiple events, you can manually set the `event_id` variable to switch between them.

3. **Test Filters**: Try combining multiple filters:
   ```
   /api/public/events/?category=MUSIC&is_free=true&start_date=2025-12-01
   ```

4. **Check Response Times**: Postman shows response times at the bottom. Use this to identify slow endpoints.

5. **Save Responses**: Use Postman's **Save Response** feature to create example responses for documentation.

## Event Categories

Available categories for filtering:
- MUSIC
- SPORTS
- BUSINESS
- ENTERTAINMENT
- CONFERENCE
- WORKSHOP
- FESTIVAL
- CHARITY
- NETWORKING
- OTHER

## Ticket Types

Available ticket type names:
- VVIP
- VIP
- REGULAR
- EARLY_BIRD
- STUDENT
- GROUP

## Promo Code Types

- **PERCENTAGE**: Discount as a percentage (e.g., 20% off)
- **FIXED**: Fixed amount discount (e.g., KES 500 off)

## Next Steps

Once Sprint 6 and 7 are implemented, this collection will be updated with:
- Booking endpoints
- Payment integration (M-Pesa, Stripe)
- Ticket generation and QR codes
- Email/SMS notifications

---

**Last Updated**: December 17, 2025
**Sprint**: Sprint 5 - Event Management System

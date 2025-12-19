# Analytics & Reporting Guide

This guide explains the analytics and reporting system for TukioHub organizers.

## Overview

The analytics app provides comprehensive insights for event organizers including:
- **Event performance metrics** (sales, revenue, attendance)
- **Sales timelines** (daily/hourly breakdowns)
- **Attendee demographics** (booking patterns, domains, repeat customers)
- **Organizer dashboard** (all events summary)
- **CSV export** (attendees and sales data)

---

## Database Models

### 1. EventAnalytics Model
Stores daily snapshots of event metrics.

**Fields:**
- `event`: ForeignKey to Event
- `date`: Date of snapshot
- `total_bookings`, `confirmed_bookings`, `cancelled_bookings`: Booking counts
- `total_tickets_sold`, `total_tickets_checked_in`: Ticket metrics
- `gross_revenue`, `net_revenue`, `discounts_given`: Revenue metrics
- `mpesa_revenue`, `card_revenue`: Payment method breakdown
- `ticket_type_sales`: JSON field with ticket type breakdown
- `promo_codes_used`: JSON field with promo code usage

### 2. OrganizerAnalytics Model
Stores monthly snapshots of organizer metrics.

**Fields:**
- `organizer`: ForeignKey to User
- `month`: First day of month
- `total_events`, `active_events`, `completed_events`, `cancelled_events`: Event counts
- `total_bookings`, `total_tickets_sold`, `total_revenue`: Sales metrics
- `avg_ticket_price`, `avg_tickets_per_event`: Averages

---

## API Endpoints

All analytics endpoints require authentication and organizer role (except where noted).

### 1. Quick Stats

**GET** `/api/analytics/quick-stats/`

Get quick summary stats for the organizer.

**Response:**
```json
{
  "total_events": 10,
  "active_events": 5,
  "total_bookings": 250,
  "total_tickets": 500,
  "total_revenue": 125000.00,
  "month_revenue": 35000.00
}
```

**Use case:** Display on organizer dashboard homepage.

---

### 2. Organizer Dashboard

**GET** `/api/analytics/dashboard/?period=30`

Get comprehensive dashboard metrics for organizer.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**Response:**
```json
{
  "organizer_id": "uuid",
  "organizer_name": "TechConf Organizers",
  "period_days": 30,
  
  "total_events": 10,
  "active_events": 5,
  "draft_events": 2,
  "completed_events": 3,
  
  "lifetime_bookings": 250,
  "lifetime_tickets": 500,
  "lifetime_revenue": 125000.00,
  
  "period_bookings": 50,
  "period_tickets": 100,
  "period_revenue": 25000.00,
  
  "avg_revenue_per_event": 12500.00,
  "avg_tickets_per_event": 50.0
}
```

**Use case:** Organizer dashboard overview page.

---

### 3. Event Overview

**GET** `/api/analytics/events/<event_id>/overview/`

Get comprehensive analytics for a specific event.

**Permissions:** Must be the event organizer.

**Response:**
```json
{
  "event_id": "uuid",
  "event_title": "Tech Conference 2024",
  "event_status": "PUBLISHED",
  "start_datetime": "2024-12-25T10:00:00Z",
  
  "total_bookings": 50,
  "confirmed_bookings": 45,
  "pending_bookings": 3,
  "cancelled_bookings": 2,
  
  "total_tickets": 100,
  "tickets_checked_in": 85,
  "check_in_rate": 85.0,
  
  "gross_revenue": 30000.00,
  "net_revenue": 27000.00,
  "total_discounts": 3000.00,
  
  "mpesa_revenue": 20000.00,
  "card_revenue": 7000.00,
  
  "ticket_types": {
    "VIP": {
      "quantity": 20,
      "revenue": 15000.00,
      "price": 750.00
    },
    "Regular": {
      "quantity": 80,
      "revenue": 12000.00,
      "price": 150.00
    }
  },
  
  "promo_codes": {
    "EARLY20": {
      "count": 10,
      "discount_total": 2000.00
    }
  },
  
  "capacity": 200,
  "tickets_available": 100,
  "capacity_used_percent": 50.0
}
```

**Use case:** Event details page with full analytics.

---

### 4. Sales Timeline

**GET** `/api/analytics/events/<event_id>/sales-timeline/?period=daily`

Get sales timeline for an event.

**Query Parameters:**
- `period` (optional): `hourly`, `daily`, or `weekly` (default: daily)

**Permissions:** Must be the event organizer.

**Response:**
```json
{
  "period": "daily",
  "data": [
    {
      "date": "2024-12-01",
      "bookings": 5,
      "tickets": 10,
      "revenue": 2500.00
    },
    {
      "date": "2024-12-02",
      "bookings": 8,
      "tickets": 15,
      "revenue": 3750.00
    }
  ]
}
```

**Use case:** Line chart showing sales over time.

---

### 5. Attendee Demographics

**GET** `/api/analytics/events/<event_id>/demographics/`

Get attendee demographic insights for an event.

**Permissions:** Must be the event organizer.

**Response:**
```json
{
  "total_attendees": 50,
  "unique_emails": 48,
  "repeat_customers": 2,
  
  "top_email_domains": [
    {"domain": "gmail.com", "count": 25},
    {"domain": "company.com", "count": 10},
    {"domain": "yahoo.com", "count": 5}
  ],
  
  "booking_hours_distribution": [0, 0, 0, 0, 0, 0, 2, 5, 8, 12, 15, 10, 8, 5, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0],
  
  "avg_tickets_per_booking": 2.5
}
```

**Fields:**
- `booking_hours_distribution`: Array of 24 integers showing bookings by hour of day (0-23)
- `top_email_domains`: Top 10 email domains by count
- `repeat_customers`: Number of email addresses with multiple bookings

**Use case:** Understand booking patterns and audience composition.

---

### 6. Export Attendees CSV

**GET** `/api/analytics/events/<event_id>/export/attendees/`

Export all attendees for an event to CSV.

**Permissions:** Must be the event organizer.

**Response:** CSV file download

**CSV Columns:**
- Booking Reference
- Attendee Name
- Attendee Email
- Attendee Phone
- Ticket Code
- Ticket Type
- Status
- Checked In
- Check-in Time
- Booking Date
- Amount Paid

**Use case:** Download attendee list for check-in, mail merge, or analysis.

---

### 7. Export Sales CSV

**GET** `/api/analytics/events/<event_id>/export/sales/`

Export all sales data for an event to CSV.

**Permissions:** Must be the event organizer.

**Response:** CSV file download

**CSV Columns:**
- Booking Reference
- Booking Date
- Attendee Name
- Attendee Email
- Status
- Tickets
- Ticket Types
- Gross Amount
- Discount
- Final Amount
- Payment Method
- Promo Code

**Use case:** Download sales data for accounting, reporting, or analysis.

---

## Using the Analytics Service

The `AnalyticsService` class provides methods for generating analytics programmatically.

### Get Event Overview
```python
from apps.analytics.services import AnalyticsService

overview = AnalyticsService.get_event_overview(event_id)
```

### Get Sales Timeline
```python
timeline = AnalyticsService.get_sales_timeline(event_id, period='daily')
```

### Get Attendee Demographics
```python
demographics = AnalyticsService.get_attendee_demographics(event_id)
```

### Get Organizer Dashboard
```python
dashboard = AnalyticsService.get_organizer_dashboard(organizer_id, period_days=30)
```

### Export CSV
```python
csv_buffer = AnalyticsService.export_event_attendees_csv(event_id)
csv_buffer = AnalyticsService.export_event_sales_csv(event_id)
```

---

## Admin Interface

Access Django admin at `/admin/analytics/` to view analytics records.

**Features:**
- View event analytics snapshots by date
- View organizer analytics snapshots by month
- Filter by date, event category
- Search by event title or organizer
- Read-only interface (analytics are calculated, not manually created)

---

## Common Use Cases

### 1. Event Performance Dashboard

Combine multiple endpoints to build a comprehensive event dashboard:

```javascript
// Quick stats
const stats = await fetch('/api/analytics/events/{id}/overview/');

// Sales timeline chart
const timeline = await fetch('/api/analytics/events/{id}/sales-timeline/?period=daily');

// Demographics
const demographics = await fetch('/api/analytics/events/{id}/demographics/');
```

Display:
- Key metrics cards (revenue, tickets sold, check-in rate)
- Sales timeline line chart
- Ticket type breakdown pie chart
- Booking hours heatmap
- Top email domains list

### 2. Organizer Overview

Show organizer's overall performance:

```javascript
const dashboard = await fetch('/api/analytics/dashboard/?period=30');
const quickStats = await fetch('/api/analytics/quick-stats/');
```

Display:
- Total events, active events
- Lifetime vs. period revenue
- Average metrics per event
- Revenue trend (last 30 days)

### 3. Pre-Event Check-in Preparation

Before the event:

```javascript
// Download attendee list
window.open('/api/analytics/events/{id}/export/attendees/');
```

Use CSV to:
- Print check-in list
- Import to check-in app
- Send pre-event reminders

### 4. Post-Event Reporting

After the event:

```javascript
const overview = await fetch('/api/analytics/events/{id}/overview/');
const sales = await fetch('/api/analytics/events/{id}/export/sales/');
```

Generate report with:
- Total attendance vs. capacity
- Check-in rate
- Revenue breakdown by ticket type
- Promo code effectiveness
- Payment method distribution

---

## Performance Considerations

### Caching
Analytics calculations can be expensive. Consider:
- Caching dashboard data for 5-10 minutes
- Generating daily snapshots via Celery Beat tasks
- Using EventAnalytics and OrganizerAnalytics models for historical data

### Indexes
The analytics models have indexes on:
- `(event, date)` for event analytics
- `(organizer, month)` for organizer analytics

### Query Optimization
All analytics queries use:
- `select_related()` for foreign keys
- `prefetch_related()` for reverse relationships
- `aggregate()` for calculations
- `only()` and `defer()` where appropriate

---

## Future Enhancements

Potential additions to analytics:

1. **Real-time Analytics**
   - WebSocket connections for live updates
   - Real-time check-in counter
   - Live sales ticker

2. **Advanced Metrics**
   - Conversion funnel (views → bookings → check-ins)
   - Revenue per ticket type trend
   - Booking completion rate
   - Average time to purchase

3. **Predictive Analytics**
   - Forecast attendance based on early sales
   - Predict sold-out date
   - Recommend pricing adjustments

4. **Comparative Analytics**
   - Compare event to previous events
   - Benchmark against category averages
   - Year-over-year comparisons

5. **Custom Reports**
   - Report builder UI
   - Scheduled report emails
   - Custom date ranges and filters

---

## Testing Analytics

### Using Postman

Import the TukioHub Postman collection and test:

1. **Login as Organizer**
2. **Create Event with Tickets**
3. **Create Bookings** (use public booking endpoint)
4. **Check Quick Stats** → `/api/analytics/quick-stats/`
5. **View Event Overview** → `/api/analytics/events/{id}/overview/`
6. **Export CSVs** → Download attendees and sales

### Using Django Admin

1. Create test event with bookings
2. Visit `/admin/analytics/eventanalytics/`
3. View calculated metrics
4. Verify calculations match actual data

---

## Troubleshooting

### No Data Returned

**Problem:** Analytics endpoint returns empty data.

**Solutions:**
- Verify event has confirmed bookings
- Check that you're the event organizer
- Ensure tickets have been generated
- Confirm date filters are correct

### CSV Export Fails

**Problem:** CSV download returns 0 bytes or errors.

**Solutions:**
- Check event has tickets/bookings
- Verify organizer permissions
- Check server logs for errors
- Ensure `io` and `csv` modules working

### Slow Response Times

**Problem:** Analytics endpoints are slow.

**Solutions:**
- Add database indexes
- Use caching for frequently accessed data
- Generate snapshots via Celery tasks
- Optimize queries with `select_related()`

---

**Last Updated:** December 20, 2024  
**Sprint:** Analytics & Reporting  
**Status:** ✅ Complete

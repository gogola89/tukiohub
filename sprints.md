# TukioHub - Sprint Implementation Guide

This document provides detailed sprint-by-sprint implementation instructions for building TukioHub, the Kenyan Event Management System.

---

## Sprint Planning Overview

**Total Duration**: 12-14 Sprints (24-28 weeks, approximately 6-7 months)
**Sprint Length**: 2 weeks each
**Team Recommendation**: 1-2 developers using Claude Code CLI

---

## **Sprint 1-2: Project Setup & Foundation** (Weeks 1-4)

### Objectives
- Set up development environment
- Initialize project structure
- Configure databases and essential services

### Tasks

#### Sprint 1
- [ ] Initialize Git repository
- [ ] Set up Django project structure
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for caching
- [ ] Create base project configuration files
- [ ] Set up environment variables management
- [ ] Configure Black/Pylint (Django)
- [ ] Set up logging framework

#### Sprint 2
- [ ] Design and implement database schema
- [ ] Create database migration scripts
- [ ] Set up authentication system (JWT)
- [ ] Implement user model and basic CRUD
- [ ] Create API documentation structure (Swagger/OpenAPI)
- [ ] Set up testing framework (Pytest)
- [ ] Configure CORS and security middleware

### Deliverables
- Functional project skeleton
- Database structure ready
- Basic authentication working
- Documentation framework in place

### Claude Code Prompt

```
Create a Django project structure for TukioHub event management system with:
- Django 5.0 with Django REST Framework
- Virtual environment setup
- PostgreSQL database configuration
- Redis cache configuration
- JWT authentication using djangorestframework-simplejwt
- Celery for async tasks
- Django Channels for WebSocket support
- Environment variable management using python-decouple
- Project apps structure:
  * users (custom user model)
  * events (event management)
  * bookings (ticket bookings)
  * payments (payment processing)
  * analytics (reporting)
- requirements.txt with all necessary dependencies
- Project settings split (base, development, production)
- .env configuration
```

---

## **Sprint 3-4: Organizer Management** (Weeks 5-8)

### Objectives
- Complete organizer registration and profile management
- Build admin panel for user approval

### Tasks

#### Sprint 3
- [ ] Organizer registration API endpoints
- [ ] Email verification system
- [ ] Profile management endpoints (CRUD)
- [ ] Document upload functionality
- [ ] Profile image upload with S3 integration
- [ ] Password reset flow
- [ ] Basic organizer dashboard API

#### Sprint 4
- [ ] Admin panel authentication
- [ ] Organizer approval/rejection workflow
- [ ] Admin dashboard for user management
- [ ] Email notifications for approvals
- [ ] Organizer verification status updates
- [ ] Basic analytics for admin

### Deliverables
- Organizers can register and manage profiles
- Admin can approve/reject organizers
- Email notifications working

### Claude Code Prompt

```
Implement user authentication for TukioHub event management system using Django REST Framework:

1. Create users/serializers.py with:
   - UserRegistrationSerializer (for organizer registration)
   - UserLoginSerializer
   - UserSerializer (for profile)
   - PasswordResetRequestSerializer
   - PasswordResetConfirmSerializer
   - EmailVerificationSerializer

2. Create users/views.py with ViewSets/APIViews:
   - POST /api/auth/register/ (organizer registration with email verification)
   - POST /api/auth/login/ (JWT token generation using simplejwt)
   - POST /api/auth/verify-email/ (email verification)
   - POST /api/auth/forgot-password/
   - POST /api/auth/reset-password/
   - GET /api/auth/me/ (get current user, requires authentication)
   - POST /api/auth/refresh/ (refresh JWT token)

3. Create users/services.py with:
   - send_verification_email() function
   - send_password_reset_email() function
   - generate_verification_token() function
   - verify_token() function

4. Create users/permissions.py with:
   - IsOrganizer permission class
   - IsAdmin permission class
   - IsVerifiedOrganizer permission class

5. Email templates (templates/emails/):
   - welcome_email.html (with verification link)
   - password_reset_email.html

6. Configure JWT settings in settings.py:
   - Access token lifetime: 1 hour
   - Refresh token lifetime: 7 days
   - Token authentication in REST_FRAMEWORK settings

Use Django's built-in password hashing, proper error handling with DRF's exception handling.
```

---

## **Sprint 5-7: Event Management System** (Weeks 9-14)

### Objectives
- Complete event creation and management
- Implement ticket type configuration

### Tasks

#### Sprint 5
- [ ] Event creation API endpoints
- [ ] Event update and delete functionality
- [ ] Event image upload (multiple images)
- [ ] Category management
- [ ] Venue management with geocoding
- [ ] Event status workflow (draft/published/cancelled)
- [ ] Event validation rules

#### Sprint 6
- [ ] Ticket types creation and management
- [ ] Pricing configuration per ticket type
- [ ] Quantity management and tracking
- [ ] Early bird pricing with date ranges
- [ ] Promo code creation and management
- [ ] Add-ons configuration
- [ ] Capacity tracking system

#### Sprint 7
- [ ] Event search and filtering API
- [ ] Event listing with pagination
- [ ] Category filtering
- [ ] Location-based filtering
- [ ] Date range filtering
- [ ] Price range filtering
- [ ] Featured events system
- [ ] Event recommendations algorithm (basic)

### Deliverables
- Organizers can create and manage events
- Complete ticketing system configured
- Event discovery system functional

### Claude Code Prompt (Event Models)

```
Create comprehensive Django models for TukioHub event management (events/models.py):

1. Event Model:
   - id (UUIDField, primary key, default=uuid.uuid4)
   - organizer (ForeignKey to User, on_delete=CASCADE)
   - title (CharField, max_length=255, required)
   - slug (SlugField, unique, auto-generated from title)
   - description (TextField)
   - category (CharField with choices: MUSIC, SPORTS, BUSINESS, ENTERTAINMENT, CONFERENCE, WORKSHOP, etc.)
   - venue_name (CharField)
   - venue_address (TextField)
   - latitude (DecimalField, max_digits=9, decimal_places=6, null=True)
   - longitude (DecimalField, max_digits=9, decimal_places=6, null=True)
   - start_datetime (DateTimeField)
   - end_datetime (DateTimeField)
   - capacity (IntegerField)
   - is_free (BooleanField, default=False)
   - status (CharField with choices: DRAFT, PUBLISHED, CANCELLED, COMPLETED)
   - featured_image (ImageField, upload_to='events/')
   - images (JSONField, default=list for additional images)
   - age_restriction (IntegerField, null=True, blank=True)
   - tags (JSONField, default=list)
   - created_at (DateTimeField, auto_now_add=True)
   - updated_at (DateTimeField, auto_now=True)

   Meta:
   - ordering = ['-start_datetime']
   - indexes on slug, category+start_datetime

   Methods:
   - save() override to auto-generate slug
   - is_upcoming() property
   - is_sold_out() property
   - available_tickets() property

2. TicketType Model:
   - id (UUIDField, primary key)
   - event (ForeignKey to Event, related_name='ticket_types')
   - name (CharField: VVIP, VIP, REGULAR, EARLY_BIRD, etc.)
   - description (TextField, blank=True)
   - price (DecimalField, max_digits=10, decimal_places=2)
   - quantity_available (IntegerField)
   - quantity_sold (IntegerField, default=0)
   - sales_start_date (DateTimeField)
   - sales_end_date (DateTimeField)
   - is_active (BooleanField, default=True)

   Meta:
   - ordering = ['price']
   - unique_together = ['event', 'name']

   Methods:
   - available_quantity() property
   - is_available() method

3. PromoCode Model:
   - id (UUIDField)
   - event (ForeignKey to Event, related_name='promo_codes')
   - code (CharField, unique, uppercase)
   - discount_type (CharField with choices: PERCENTAGE, FIXED)
   - discount_value (DecimalField)
   - usage_limit (IntegerField, null=True)
   - times_used (IntegerField, default=0)
   - valid_from (DateTimeField)
   - valid_until (DateTimeField)
   - is_active (BooleanField, default=True)

   Methods:
   - save() override to uppercase code
   - is_valid() method
   - can_be_used() method
   - apply_discount(amount) method

4. EventAddOn Model:
   - id (UUIDField)
   - event (ForeignKey to Event, related_name='addons')
   - name (CharField: "VIP Parking", "Merchandise", etc.)
   - description (TextField)
   - price (DecimalField)
   - quantity_available (IntegerField, null=True)
   - is_active (BooleanField)

5. EventImage Model (for multiple images):
   - id (UUIDField)
   - event (ForeignKey to Event, related_name='event_images')
   - image (ImageField)
   - order (IntegerField, default=0)
   - created_at (DateTimeField)

   Meta:
   - ordering = ['order']

Include all necessary choices tuples, __str__ methods, and custom managers where needed.
Add model validation in clean() methods.
```

### Claude Code Prompt (Event APIs)

```
Create comprehensive event management APIs for TukioHub using Django REST Framework:

1. events/serializers.py with:
   - EventListSerializer (for list view with minimal data)
   - EventDetailSerializer (with nested ticket types, images)
   - EventCreateSerializer (with validation)
   - TicketTypeSerializer
   - PromoCodeSerializer
   - EventAddOnSerializer
   - EventImageSerializer

2. events/views.py (Organizer ViewSets):
   - EventViewSet (ModelViewSet):
     * list() - GET /api/events/ (organizer's events with pagination)
     * create() - POST /api/events/ (create event)
     * retrieve() - GET /api/events/<id>/
     * update() - PUT/PATCH /api/events/<id>/
     * destroy() - DELETE /api/events/<id>/ (soft delete)
     * Custom action: publish() - POST /api/events/<id>/publish/
     * Custom action: upload_images() - POST /api/events/<id>/images/

   - TicketTypeViewSet (nested under events):
     * POST /api/events/<event_id>/tickets/
     * PUT /api/events/<event_id>/tickets/<id>/
     * DELETE /api/events/<event_id>/tickets/<id>/

   - PromoCodeViewSet:
     * POST /api/events/<event_id>/promo-codes/
     * PUT /api/events/<event_id>/promo-codes/<id>/
     * GET /api/events/<event_id>/promo-codes/

3. events/public_views.py (Public APIViews/ViewSets):
   - PublicEventViewSet:
     * list() - GET /api/public/events/ (with advanced filtering)
     * retrieve() - GET /api/public/events/<slug>/ (by slug)

   - FeaturedEventsAPIView:
     * GET /api/public/events/featured/

   - EventCategoriesAPIView:
     * GET /api/public/events/categories/

   - EventSearchAPIView:
     * GET /api/public/search/?q=<query>

4. events/services.py with:
   - generate_slug(title) function
   - geocode_address(address) function using Google Maps API
   - calculate_distance(lat1, lon1, lat2, lon2) function
   - cache_event_data(event_id) function using Redis

5. events/filters.py (using django-filter):
   - EventFilter class with:
     * category filter
     * location filter (city)
     * date range filter (start_date, end_date)
     * price range filter (min_price, max_price)
     * search filter (title, description)
     * is_free filter
   - Custom FilterSet with proximity filter

6. Implement advanced features:
   - Full-text search using PostgreSQL
   - Distance-based filtering (events near location)
   - Sorting options (date, price, popularity)
   - Pagination (PageNumberPagination)
   - Caching for public event lists

7. URL routing (events/urls.py):
   - Use DRF routers for ViewSets
   - Nested routing for ticket types

Include:
- Proper permissions (IsAuthenticated for organizer, AllowAny for public)
- Validation using DRF serializers
- Error handling with custom exceptions
- Throttling for public APIs
- Swagger documentation
```

---

## **Sprint 8-9: Frontend - Public Website** (Weeks 15-18)

### Objectives
- Build the public-facing event discovery interface
- Create event details and booking flow UI

### Tasks

#### Sprint 8
- [ ] Set up React/Next.js project
- [ ] Configure Tailwind CSS and UI components
- [ ] Homepage design and implementation
- [ ] Event listing page with filters
- [ ] Search functionality
- [ ] Category navigation
- [ ] Responsive design for mobile

#### Sprint 9
- [ ] Event details page
- [ ] Interactive map integration (Google Maps)
- [ ] Image gallery/carousel
- [ ] Social sharing functionality
- [ ] Ticket selection interface
- [ ] Promo code application UI
- [ ] Add to calendar functionality

### Deliverables
- Fully functional public website
- Users can browse and view events
- Responsive design across devices

### Claude Code Prompt (Homepage)

```
Create the homepage and event listing pages for TukioHub:

1. Homepage (app/page.tsx):
   - Hero section with search bar
   - Featured events carousel
   - Category grid with icons
   - Upcoming events section
   - Footer with links

2. Event Listing Page (app/events/page.tsx):
   - Search and filter sidebar
   - Event cards grid with:
     * Event image
     * Title, date, venue
     * Price range
     * Category badge
   - Pagination
   - Loading states
   - Empty states

3. Filter Component:
   - Category selector
   - Location dropdown (Kenyan cities)
   - Date range picker
   - Price range slider
   - Clear filters button

4. Create API client functions for:
   - Fetching events with filters
   - Fetching categories
   - Searching events

Use responsive design, mobile-first approach, proper TypeScript typing.
```

### Claude Code Prompt (Event Details)

```
Create a comprehensive event details page for TukioHub (app/events/[slug]/page.tsx):

1. Layout:
   - Image gallery/carousel
   - Event title and organizer info
   - Date, time, location with map
   - Description with rich text formatting
   - Ticket selection section
   - Share buttons (social media)
   - Similar events section

2. Interactive Map:
   - Integrate Google Maps to show venue location
   - Marker on venue
   - Get directions link

3. Ticket Selection Component:
   - List of ticket types with prices
   - Quantity selectors
   - Total price calculation
   - Promo code input field
   - Proceed to checkout button
   - Availability status display

4. Social Sharing:
   - Facebook, Twitter, WhatsApp, Email
   - Copy link functionality

5. Add to Calendar:
   - Google Calendar
   - iCal download

Use proper SEO with Next.js metadata, include structured data for search engines.
```

---

## **Sprint 10-11: Payment Integration** (Weeks 19-22)

### Objectives
- Integrate M-Pesa STK Push
- Integrate card payment gateway
- Implement payment verification and webhook handling

### Tasks

#### Sprint 10 - M-Pesa Integration
- [ ] Register app on Safaricom Daraja portal
- [ ] Implement OAuth token generation
- [ ] Create STK Push initiation endpoint
- [ ] Implement STK Push callback handler
- [ ] Transaction verification system
- [ ] Payment status tracking
- [ ] Failed payment retry mechanism
- [ ] M-Pesa testing in sandbox
- [ ] Move to production (Go Live process)

#### Sprint 11 - Card Payments & Completion
- [ ] Integrate Stripe/Flutterwave
- [ ] Payment form UI
- [ ] 3D Secure implementation
- [ ] Webhook handlers for payment status
- [ ] Refund API implementation
- [ ] Payment receipt generation
- [ ] Transaction logging and audit trail
- [ ] Testing payment flows end-to-end

### Deliverables
- Working M-Pesa STK Push
- Card payments functional
- Secure payment processing
- Payment confirmations

### Claude Code Prompt (M-Pesa Integration)

```
Implement M-Pesa Daraja API STK Push integration for TukioHub in Django:

1. Create payments/mpesa_service.py with:
   - MpesaService class with methods:
     * get_access_token() - OAuth token generation with Redis caching
     * generate_password(timestamp) - Base64 encoding of shortcode+passkey+timestamp
     * get_timestamp() - Returns timestamp in YYYYMMDDHHmmss format
     * initiate_stk_push(phone_number, amount, account_reference, description) - Initiates payment
     * query_transaction_status(checkout_request_id) - Check transaction status

   - Use requests library for API calls
   - Cache access token in Redis (expires in 55 minutes)
   - Proper error handling for all API calls

2. Create payments/views.py with:
   - InitiateMpesaPaymentAPIView (POST /api/payments/mpesa/initiate/):
     * Validates phone number (Kenyan format: 254XXXXXXXXX)
     * Validates amount
     * Creates pending Transaction record
     * Initiates STK Push
     * Returns response with checkout_request_id

   - MpesaCallbackAPIView (POST /api/payments/mpesa/callback/):
     * Receives Daraja callback
     * No authentication required (validate using request parameters)
     * Updates Transaction status
     * Triggers booking confirmation on success
     * Uses Celery task for processing

   - CheckPaymentStatusAPIView (GET /api/payments/status/<reference>/):
     * Returns current payment status
     * Polls transaction status if pending

3. Create payments/models.py:
   - Transaction model:
     * id (UUIDField)
     * booking (ForeignKey, can be null initially)
     * amount (DecimalField)
     * phone_number (CharField)
     * mpesa_receipt_number (CharField, blank=True)
     * checkout_request_id (CharField, unique)
     * transaction_reference (CharField, unique)
     * status (CharField: PENDING, COMPLETED, FAILED, CANCELLED)
     * result_code (IntegerField, null=True)
     * result_description (TextField, blank=True)
     * created_at (DateTimeField)
     * updated_at (DateTimeField)

4. Create payments/serializers.py:
   - InitiateMpesaPaymentSerializer
   - TransactionStatusSerializer

5. Payment Flow implementation:
   - Generate unique payment reference
   - Store pending transaction in database
   - Initiate STK Push to customer's phone
   - Handle callback asynchronously using Celery
   - Update transaction status
   - Trigger ticket generation on successful payment

6. Error Handling scenarios:
   - Timeout (user doesn't enter PIN)
   - Cancelled by user
   - Insufficient funds
   - Invalid phone number
   - Network errors
   - Implement retry mechanism with exponential backoff

7. Testing:
   - Use Safaricom sandbox environment
   - Create test cases for different scenarios
   - Mock Daraja API responses for unit tests

8. Settings configuration (settings.py):
   - MPESA_CONSUMER_KEY
   - MPESA_CONSUMER_SECRET
   - MPESA_PASSKEY
   - MPESA_SHORTCODE
   - MPESA_CALLBACK_URL
   - MPESA_ENVIRONMENT (sandbox/production)

Include comprehensive logging for debugging, environment variable configuration,
and proper transaction management to ensure data consistency.
```

### Claude Code Prompt (Card Payment Integration)

```
Integrate Stripe payment gateway for TukioHub with Django:

1. Install stripe package: pip install stripe

2. Create payments/stripe_service.py with:
   - StripeService class with methods:
     * create_payment_intent(amount, currency, metadata) - Creates Stripe PaymentIntent
     * handle_webhook_event(payload, signature) - Processes webhook events
     * create_refund(payment_intent_id, amount) - Process refunds

   - Configure stripe.api_key in __init__

3. Update payments/views.py with:
   - CreateStripePaymentIntentAPIView (POST /api/payments/card/create-intent/):
     * Accepts amount and booking details
     * Creates payment intent
     * Returns client_secret for frontend
     * Creates pending Transaction record

   - StripeWebhookAPIView (POST /api/payments/card/webhook/):
     * @csrf_exempt decorator
     * Verifies webhook signature
     * Handles events:
       - payment_intent.succeeded
       - payment_intent.payment_failed
       - charge.refunded
     * Updates Transaction status
     * Triggers booking confirmation
     * Uses Celery for async processing

   - RefundPaymentAPIView (POST /api/payments/refund/):
     * Processes refund requests
     * Validates refund eligibility
     * Updates booking and transaction

4. Update payments/models.py:
   - Add fields to Transaction model:
     * stripe_payment_intent_id (CharField, blank=True)
     * payment_method_type (CharField: card, mpesa)

5. Frontend Integration notes:
   - Use Stripe.js and Elements on checkout page
   - Handle 3D Secure authentication
   - Display payment errors to users
   - Success/failure redirects

6. Security considerations:
   - Verify webhook signatures using stripe.Webhook.construct_event()
   - Use HTTPS only (enforce in production)
   - Store sensitive data encrypted
   - PCI DSS compliance (don't store card details)

7. Settings configuration:
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET

8. Error handling:
   - Card declined
   - Insufficient funds
   - Invalid card details
   - Network errors
   - Webhook signature verification failures

Include proper error messages for users, logging for debugging,
and transaction rollback on failures.
```

---

## **Sprint 12: Ticket Generation & Delivery** (Weeks 23-24)

### Objectives
- Generate tickets with QR codes
- Implement email and SMS delivery
- Create ticket verification system

### Tasks
- [ ] QR code generation for tickets
- [ ] PDF ticket template design
- [ ] PDF generation service
- [ ] Email delivery with SendGrid
- [ ] SMS delivery with Africa's Talking
- [ ] Booking confirmation page
- [ ] Ticket retrieval by booking reference
- [ ] QR code scanner API (for check-in)
- [ ] Duplicate check-in prevention
- [ ] Ticket transfer functionality

### Deliverables
- Tickets generated with QR codes
- Tickets delivered via email and SMS
- Check-in system operational

### Claude Code Prompt (Booking System)

```
Create comprehensive booking system for TukioHub using Django:

1. Create bookings/models.py with:
   - Booking model:
     * id (UUIDField, primary key)
     * booking_reference (CharField, unique, auto-generated)
     * event (ForeignKey to Event)
     * attendee_name (CharField)
     * attendee_email (EmailField)
     * attendee_phone (CharField)
     * total_amount (DecimalField)
     * discount_amount (DecimalField, default=0)
     * final_amount (DecimalField)
     * payment_status (CharField: PENDING, PAID, REFUNDED, CANCELLED)
     * payment_method (CharField: MPESA, CARD)
     * promo_code (ForeignKey to PromoCode, null=True)
     * status (CharField: PENDING, CONFIRMED, CANCELLED)
     * created_at, updated_at

   - BookingItem model:
     * booking (ForeignKey to Booking)
     * ticket_type (ForeignKey to TicketType)
     * quantity (IntegerField)
     * price_per_ticket (DecimalField)
     * subtotal (DecimalField, calculated)

   - Ticket model:
     * id (UUIDField)
     * booking (ForeignKey to Booking)
     * ticket_code (CharField, unique, for QR code)
     * attendee_name (CharField)
     * ticket_type (ForeignKey to TicketType)
     * status (CharField: ACTIVE, USED, CANCELLED, TRANSFERRED)
     * checked_in_at (DateTimeField, null=True)
     * qr_code_image (ImageField, blank=True)

   Include Meta classes with ordering and indexes.
   Add model methods: generate_booking_reference(), generate_ticket_code()

2. Create bookings/serializers.py with:
   - BookingItemSerializer
   - CreateBookingSerializer (with nested items)
   - BookingDetailSerializer (with nested tickets)
   - TicketSerializer
   - TicketTransferSerializer

3. Create bookings/views.py with:
   - CreateBookingAPIView (POST /api/bookings/create/):
     * Validates attendee information
     * Validates ticket availability
     * Validates event is not past
     * Validates promo code if provided
     * Creates booking with PENDING status
     * Locks ticket inventory (using select_for_update)
     * Returns booking details with payment instructions

   - GetBookingAPIView (GET /api/bookings/<reference>/):
     * Public endpoint (no auth required)
     * Returns booking details by reference
     * Includes ticket information

   - CancelBookingAPIView (POST /api/bookings/<id>/cancel/):
     * Validates cancellation eligibility
     * Processes refund if applicable
     * Updates booking status
     * Releases ticket inventory

4. Create bookings/services.py with:
   - BookingService class:
     * create_booking(event, items, attendee_info, promo_code)
     * validate_ticket_availability(event, items)
     * apply_promo_code(booking, promo_code)
     * calculate_total(items)
     * lock_inventory(items) - uses database transactions
     * release_inventory(booking) - on timeout or cancellation
     * confirm_booking(booking, transaction) - after payment
     * generate_tickets(booking) - creates individual tickets

5. Booking Workflow:
   a. User selects tickets on frontend
   b. Frontend calls /api/bookings/create/ with attendee info
   c. Backend creates PENDING booking and locks inventory
   d. Set 5-minute timeout (Celery task)
   e. Return booking_reference and payment details
   f. User proceeds to payment
   g. On successful payment:
      - Update booking status to CONFIRMED
      - Generate individual tickets
      - Send confirmation email/SMS
   h. On timeout (5 minutes):
      - Release inventory
      - Mark booking as EXPIRED

6. Inventory Management:
   - Use database transactions and select_for_update() for locking
   - Prevent overselling
   - Handle concurrent bookings
   - Automatic inventory release on timeout

7. Validation:
   - Validate attendee email format
   - Validate phone number (Kenyan format)
   - Validate ticket availability
   - Validate event is published and not past
   - Validate promo code (if provided):
     * Is valid and active
     * Not expired
     * Usage limit not exceeded
     * Applicable to selected tickets

8. Create bookings/tasks.py (Celery tasks):
   - release_inventory_task(booking_id) - scheduled after 5 minutes
   - send_booking_confirmation(booking_id)
   - send_ticket_email(booking_id)

Include proper error handling, atomic database transactions using @transaction.atomic,
and comprehensive logging.
```

### Claude Code Prompt (Ticket Generation)

```
Implement ticket generation and delivery system for TukioHub in Django:

1. Create bookings/ticket_service.py with:
   - TicketService class with methods:
     * generate_qr_code(ticket_code) -> Image
       - Use qrcode library: pip install qrcode[pil]
       - Returns PIL Image object
       - High error correction

     * generate_ticket_pdf(ticket) -> bytes
       - Use ReportLab: pip install reportlab
       - Professional ticket template with:
         * Event name, date, time, venue
         * Attendee name
         * Ticket type (VVIP, VIP, etc.)
         * Large QR code (centered)
         * Booking reference
         * Terms and conditions footer
         * Organizer contact
       - Returns PDF as bytes

     * generate_tickets_for_booking(booking) -> List[Ticket]
       - Creates individual Ticket objects
       - Generates unique ticket_code for each
       - Generates QR code image
       - Returns list of created tickets

2. Create notifications/email_service.py:
   - EmailService class using SendGrid:
     * send_ticket_email(booking, tickets)
       - Attaches PDF tickets
       - HTML email template
       - Includes booking summary

     * send_booking_confirmation(booking)
     * send_event_reminder(booking, hours_before=24)
     * send_refund_confirmation(booking)

   - Use django-sendgrid-v5: pip install django-sendgrid-v5
   - Email templates in templates/emails/

3. Create notifications/sms_service.py:
   - SMSService class using Africa's Talking:
     * send_booking_confirmation_sms(booking)
       - Message: "Booking confirmed! Ref: {ref}. Tickets sent to {email}. Event: {event} on {date}"
       - Max 160 characters

     * send_ticket_sms(ticket)
     * send_event_reminder_sms(booking)

   - Use africastalking: pip install africastalking

4. Create bookings/views.py additions:
   - VerifyTicketAPIView (POST /api/tickets/verify/):
     * Accepts ticket_code (from QR scan)
     * Returns ticket details if valid
     * Checks if already used

   - CheckInTicketAPIView (PUT /api/tickets/<id>/checkin/):
     * Marks ticket as USED
     * Records check-in timestamp
     * Prevents duplicate check-ins
     * Requires organizer authentication

   - TransferTicketAPIView (POST /api/tickets/<id>/transfer/):
     * Validates transfer is allowed
     * Updates attendee_name
     * Generates new ticket PDF
     * Sends to new recipient
     * Updates status to TRANSFERRED

5. Create bookings/signals.py:
   - post_save signal on Transaction model:
     * When status changes to COMPLETED:
       - Confirm booking
       - Generate tickets
       - Send email and SMS
       - Trigger asynchronously using Celery

6. Frontend integration:
   - Booking confirmation page (displays ticket)
   - Download ticket button
   - Email sent confirmation message
   - Retrieve ticket by booking reference page

7. Templates (templates/tickets/):
   - ticket_template.html (base ticket design)
   - PDF generation using HTML to PDF converter
   - Or use ReportLab for programmatic generation

8. Celery tasks (bookings/tasks.py):
   - generate_and_send_tickets_task(booking_id)
   - send_event_reminder_task(booking_id)
   - scheduled using Celery Beat

9. Rate limiting:
   - Implement throttling on verification endpoint
   - Prevent abuse of check-in endpoint
   - Use django-ratelimit

Include proper error handling, logging, retry logic for email/SMS failures,
and queue failed notifications for retry.
```

---

## **Sprint 13: Organizer Dashboard** (Weeks 25-26)

### Objectives
- Build comprehensive organizer dashboard
- Implement analytics and reporting

### Tasks
- [ ] Dashboard home page with key metrics
- [ ] Event list management interface
- [ ] Ticket sales tracking interface
- [ ] Attendee list view and export
- [ ] Check-in interface (QR scanner)
- [ ] Revenue reports and charts
- [ ] Transaction history
- [ ] Email/SMS broadcast to attendees
- [ ] Event updates functionality
- [ ] Refund management interface

### Deliverables
- Complete organizer dashboard
- Event management tools
- Analytics and reporting
- Communication tools

### Claude Code Prompt

```
Create organizer dashboard for TukioHub (app/dashboard):

1. Layout (app/dashboard/layout.tsx):
   - Sidebar navigation
   - Header with user info and logout
   - Responsive design (mobile menu)

2. Dashboard Home (app/dashboard/page.tsx):
   - Key metrics cards:
     * Total events
     * Active events
     * Total tickets sold
     * Total revenue
   - Recent bookings table
   - Revenue chart (last 30 days)
   - Quick actions (create event, view tickets)

3. Events Management (app/dashboard/events):
   - Events list with status
   - Create/edit event form (multi-step)
   - Event details view
   - Publish/unpublish toggle
   - Duplicate event feature

4. Tickets & Bookings (app/dashboard/bookings):
   - Bookings list with filters
   - Search by booking reference
   - Attendee details
   - Check-in status
   - Export to CSV/Excel
   - Refund processing

5. Check-in Interface (app/dashboard/checkin):
   - QR code scanner (use device camera)
   - Manual check-in by search
   - Real-time check-in count
   - Duplicate check-in alert

6. Reports (app/dashboard/reports):
   - Sales report by date range
   - Ticket type breakdown
   - Revenue summary
   - Attendee demographics
   - Export reports

7. Communication (app/dashboard/communications):
   - Compose email to attendees
   - Email history
   - Schedule reminders

Use charts from Recharts library, implement real-time updates with WebSockets.
```

---

## **Sprint 14: Testing, Optimization & Admin Panel** (Weeks 27-28)

### Objectives
- Comprehensive testing
- Performance optimization
- Complete admin panel

### Tasks
- [ ] Admin dashboard UI
- [ ] Platform analytics and reporting
- [ ] Commission management
- [ ] Payout processing interface
- [ ] Content management system
- [ ] Unit testing (80% coverage minimum)
- [ ] Integration testing
- [ ] End-to-end testing (Cypress/Playwright)
- [ ] Load testing and optimization
- [ ] Security audit
- [ ] Accessibility testing
- [ ] SEO optimization
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Bug fixing and refinement

### Deliverables
- Admin panel complete
- All tests passing
- Performance optimized
- Production-ready system

### Claude Code Prompt (Testing)

```
Create comprehensive test suite for TukioHub:

1. Unit Tests (80% coverage target):
   - All services (auth, event, booking, payment)
   - All utilities and helpers
   - Test success and error scenarios

2. Integration Tests:
   - API endpoints with database
   - Payment flow (use mocks)
   - Booking workflow
   - Ticket generation

3. E2E Tests (using Playwright or Cypress):
   - Complete booking flow
   - Organizer event creation
   - Admin approval workflow
   - Search and filter functionality

4. Load Testing (using k6 or Artillery):
   - Simulate high concurrent bookings
   - Test database performance
   - Test payment API limits

5. Security Testing:
   - SQL injection attempts
   - XSS vulnerabilities
   - CSRF protection
   - Rate limiting effectiveness

Create scripts for running tests in CI/CD pipeline.
```

### Claude Code Prompt (Admin Panel)

```
Create admin panel for TukioHub (app/admin):

1. Admin Dashboard (app/admin/page.tsx):
   - Platform-wide metrics
   - Total users, events, bookings
   - Revenue summary
   - Recent activity feed

2. Organizer Management (app/admin/organizers):
   - List all organizers
   - Approve/reject pending organizers
   - View organizer details and documents
   - Suspend/activate organizers
   - View organizer's events

3. Event Moderation (app/admin/events):
   - List all events
   - Filter by status, category
   - Moderate event content
   - Feature/unfeature events
   - Cancel events if needed

4. Transaction Monitoring (app/admin/transactions):
   - All transactions with filters
   - Fraud detection flags
   - Refund processing
   - Settlement tracking

5. Platform Settings (app/admin/settings):
   - Commission rate settings
   - Feature flags
   - Category management
   - Email template customization

6. Support (app/admin/support):
   - User-submitted issues
   - Contact forms
   - Ticket management system

Include comprehensive audit logging for admin actions.
```

---

## **Sprint 15-16: Beta Testing & Launch Preparation** (Weeks 29-32)

### Objectives
- Conduct beta testing with real users
- Fix bugs and gather feedback
- Prepare for production launch

### Tasks

#### Sprint 15 - Beta Testing
- [ ] Deploy to staging environment
- [ ] Recruit beta testers (organizers and attendees)
- [ ] Set up feedback collection system
- [ ] Monitor system performance
- [ ] Track user behavior and pain points
- [ ] Fix critical bugs
- [ ] Implement priority feature requests

#### Sprint 16 - Launch Prep
- [ ] Production environment setup
- [ ] SSL certificate configuration
- [ ] Domain configuration
- [ ] Backup and disaster recovery setup
- [ ] Monitoring and alerting (Sentry, Datadog)
- [ ] Create user documentation/help center
- [ ] Create video tutorials
- [ ] Marketing materials preparation
- [ ] Final security audit
- [ ] Load balancing configuration
- [ ] CDN setup for static assets

### Deliverables
- Beta-tested system
- Production environment ready
- Documentation complete
- Ready for public launch

---

## Success Checklist

- [ ] Django project set up with all apps
- [ ] All models created and migrated
- [ ] All API endpoints implemented with DRF
- [ ] Tests passing (>80% coverage)
- [ ] Security audit completed
- [ ] Performance optimized (<2s page load)
- [ ] M-Pesa integration tested and live
- [ ] Email/SMS delivery working
- [ ] QR code generation and scanning working
- [ ] Payment webhooks handling properly
- [ ] Database backups automated
- [ ] Celery workers running
- [ ] Celery Beat scheduling tasks
- [ ] Monitoring and alerting active
- [ ] Documentation complete
- [ ] Beta testing completed
- [ ] Production deployment successful
- [ ] Django admin customized
- [ ] Static files serving correctly
- [ ] Media files uploading to S3

---

**Document Version**: 1.0
**Last Updated**: December 15, 2025
**Project**: TukioHub - Kenyan Event Management System

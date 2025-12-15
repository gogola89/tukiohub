# Claude Code CLI Implementation Guide
## TukioHub - Event Management System for Kenya

This guide provides detailed implementation instructions for building TukioHub using Claude Code CLI agents.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Initialization](#project-initialization)
3. [Sprint-by-Sprint Implementation](#sprint-by-sprint-implementation)
4. [Code Structure](#code-structure)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Guide](#deployment-guide)

---

## Prerequisites

### Required Tools
```bash
# Install Python (3.10 or higher)
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip

# Install Claude Code CLI
pip install --upgrade anthropic-claude

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib libpq-dev

# Install Redis
sudo apt-get install redis-server

# Verify installations
python3 --version
pip3 --version
psql --version
redis-cli --version
claude --version
```

### Required Accounts
1. **Safaricom Daraja** (M-Pesa): https://developer.safaricom.co.ke/
2. **SendGrid** (Email): https://sendgrid.com/
3. **Africa's Talking** (SMS): https://africastalking.com/
4. **AWS** or **DigitalOcean** (Hosting)
5. **Stripe** or **Flutterwave** (Card Payments)

---

## Project Initialization

### Step 1: Create Project Directory

```bash
mkdir kenyan-event-management
cd kenyan-event-management

# Initialize git
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore
```

### Step 2: Initialize Django Project

```bash
# Use Claude to create project structure
claude code

# Then prompt:
"""
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
"""
```

### Step 3: Database Setup

```bash
# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql -c "CREATE DATABASE event_management_db;"
sudo -u postgres psql -c "CREATE USER event_admin WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE event_management_db TO event_admin;"

# Start Redis
sudo service redis-server start
```

### Step 4: Environment Configuration

```bash
# Use Claude to create .env file
claude code

# Prompt:
"""
Create a .env.example file with all necessary environment variables for Django:
- SECRET_KEY (Django secret key)
- DEBUG (True/False)
- ALLOWED_HOSTS
- Database configuration (PostgreSQL - NAME, USER, PASSWORD, HOST, PORT)
- Redis configuration (REDIS_URL)
- JWT settings (ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME)
- M-Pesa Daraja API credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE, MPESA_CALLBACK_URL)
- SendGrid API key (SENDGRID_API_KEY, DEFAULT_FROM_EMAIL)
- Africa's Talking API credentials (AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY)
- Stripe/Flutterwave API keys
- AWS S3 credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME)
- Celery broker URL
- CORS settings
"""
```

---

## Sprint-by-Sprint Implementation

### Sprint 1-2: Foundation & Authentication

#### Database Schema Design

```bash
claude code

# Prompt for Django models:
"""
Create Django models for an event management system with the following:

1. Custom User Model (users/models.py extending AbstractUser):
   - id (UUIDField, primary key)
   - email (EmailField, unique, required)
   - password (handled by Django auth)
   - role (CharField with choices: ORGANIZER, ADMIN)
   - company_name (CharField, optional)
   - phone_number (CharField)
   - logo (ImageField, optional)
   - verification_status (CharField with choices: PENDING, APPROVED, REJECTED)
   - verification_documents (JSONField)
   - is_active (BooleanField, default True)
   - created_at (DateTimeField, auto_now_add)
   - updated_at (DateTimeField, auto_now)
   
   Include Meta class with ordering and indexes

2. PasswordReset Model (users/models.py):
   - id (UUIDField, primary key)
   - user (ForeignKey to User)
   - token (CharField, unique)
   - expires_at (DateTimeField)
   - used (BooleanField, default False)
   - created_at (DateTimeField, auto_now_add)

Include proper __str__ methods, Meta classes, and any necessary model managers.
Also create choices tuples for role and verification_status fields.
"""
```

#### Authentication Implementation

```bash
claude code

# Prompt for authentication:
"""
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
"""
```

#### Testing Setup

```bash
claude code

# Prompt:
"""
Set up Django testing framework with:
1. pytest configuration for Django (pytest-django)
2. Factory Boy for test data generation
3. Test database configuration in settings
4. fixtures for common test data
5. Example unit tests for user authentication (tests/test_auth.py)
6. Example API tests using DRF's APITestCase (tests/test_api.py)
7. Test utilities (test_utils.py) with:
   - Helper functions for creating test users
   - Helper functions for JWT token generation
   - API client configuration
8. conftest.py with pytest fixtures
9. Coverage configuration (.coveragerc)

Include instructions for running tests with coverage.
"""
```

### Sprint 3-4: Organizer Management

```bash
claude code

# Prompt:
"""
Implement organizer profile management using Django REST Framework:

1. Update users/models.py to add:
   - OrganizerProfile model with detailed fields (one-to-one with User)
   - Fields: bio, website, social_media_links (JSONField), business_registration_number, etc.
   
2. Create users/serializers.py additions:
   - OrganizerProfileSerializer (with nested user data)
   - OrganizerDocumentSerializer
   
3. Create users/views.py endpoints (using ViewSets):
   - GET /api/organizer/profile/ (get current organizer profile)
   - PUT/PATCH /api/organizer/profile/ (update profile)
   - POST /api/organizer/profile/logo/ (upload logo to AWS S3)
   - POST /api/organizer/documents/ (upload verification documents)
   - GET /api/organizer/events/ (list organizer's events)

4. Create users/admin_views.py for admin endpoints:
   - GET /api/admin/organizers/ (list all organizers with filters)
   - PUT /api/admin/organizers/<id>/verify/ (approve/reject organizer)
   - GET /api/admin/organizers/<id>/ (get organizer details)
   - PATCH /api/admin/organizers/<id>/ (update organizer status)

5. Create users/services.py additions:
   - upload_to_s3() function using boto3
   - create_thumbnail() function for image optimization
   - send_verification_status_email() function

6. File upload handling:
   - Configure django-storages for S3
   - Add file validation (size, type)
   - Create custom storage backend if needed

7. Create signals (users/signals.py):
   - post_save signal to create OrganizerProfile when User is created
   - post_save signal to send email on verification status change

Include proper permissions (IsAuthenticated, IsOrganizer, IsAdmin), 
pagination for list views, and filtering/searching capabilities.
"""
```

### Sprint 5-7: Event Management

#### Event Models

```bash
claude code

# Prompt for event models:
"""
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
"""
```

#### Event APIs

```bash
claude code

# Prompt for event APIs:
"""
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
"""
```

#### Venue Geocoding

```bash
claude code

# Prompt:
"""
Create a geocoding service for venue addresses in Django:

1. Create events/utils/geocoding.py with:
   - geocode_address(address: str) -> dict function
     * Uses Google Maps Geocoding API
     * Returns {'latitude': float, 'longitude': float, 'formatted_address': str}
     * Handles errors gracefully
   
   - reverse_geocode(lat: float, lng: float) -> str function
   
   - calculate_distance(lat1, lon1, lat2, lon2) -> float function
     * Uses Haversine formula
     * Returns distance in kilometers

2. Redis caching implementation:
   - Cache geocoding results to avoid repeated API calls
   - Cache key format: 'geocode:{address_hash}'
   - TTL: 30 days
   - Use django-redis

3. Create events/signals.py:
   - pre_save signal for Event model
   - Automatically geocode venue_address when event is saved
   - Update latitude and longitude fields

4. Error handling:
   - Handle invalid addresses
   - Handle API rate limits
   - Log errors appropriately
   - Fallback to manual coordinates if geocoding fails

5. Create management command (events/management/commands/geocode_venues.py):
   - Re-geocode all events missing coordinates
   - Useful for data migration

Include proper error handling, logging, and rate limiting protection.
Add Google Maps API key to settings.
"""
```

### Sprint 8-9: Frontend Development

#### React Project Setup

```bash
# Create frontend directory
mkdir frontend
cd frontend

claude code

# Prompt:
"""
Create a Next.js 14 application with:
1. TypeScript configuration
2. Tailwind CSS setup with custom theme
3. App router structure
4. API client setup using Axios
5. State management using Context API or Zustand
6. Form handling with React Hook Form
7. UI components using Shadcn/ui

Folder structure:
- app/ (Next.js app router)
- components/ (reusable components)
- lib/ (utilities, API client)
- hooks/ (custom hooks)
- types/ (TypeScript types)
- styles/ (global styles)
"""
```

#### Homepage & Event Listing

```bash
claude code

# Prompt:
"""
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
"""
```

#### Event Details Page

```bash
claude code

# Prompt:
"""
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
"""
```

### Sprint 10-11: Payment Integration

#### M-Pesa STK Push Implementation

```bash
claude code

# Prompt:
"""
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
"""
```

#### Card Payment Integration

```bash
claude code

# Prompt:
"""
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
"""
```

#### Booking System

```bash
claude code

# Prompt:
"""
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
"""
```

### Sprint 12: Ticket Generation & Delivery

#### Ticket Generation

```bash
claude code

# Prompt:
"""
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
"""
```

#### Email & SMS Templates

```bash
claude code

# Prompt:
"""
Create email and SMS templates:

1. Email Templates (HTML):
   - Welcome email (organizer registration)
   - Email verification
   - Password reset
   - Ticket delivery (with PDF attachment)
   - Booking confirmation
   - Event reminder (24 hours before)
   - Event updates from organizer
   - Refund confirmation

2. SMS Templates (plain text, max 160 characters):
   - Booking confirmation with reference
   - Payment successful
   - Ticket delivery notification
   - Event reminder

3. Create template.service.ts:
   - Template rendering with variable interpolation
   - Support for dynamic content

Use professional styling for emails, ensure mobile responsiveness.
"""
```

### Sprint 13: Organizer Dashboard

#### Dashboard UI

```bash
cd frontend
claude code

# Prompt:
"""
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
"""
```

#### Analytics Backend

```bash
claude code

# Prompt:
"""
Create analytics and reporting APIs:

1. Create analytics.controller.ts with:
   - GET /analytics/dashboard (dashboard metrics)
   - GET /analytics/sales (sales data for charts)
   - GET /analytics/attendees (attendee demographics)
   - GET /analytics/revenue (revenue breakdown)

2. Create analytics.service.ts with:
   - Calculate metrics efficiently using database aggregations
   - Cache frequently accessed data
   - Generate reports in various formats (JSON, CSV)

3. Create export.service.ts:
   - Export attendees to CSV/Excel
   - Export transaction reports
   - Include filters and sorting

4. Implement WebSocket for real-time updates:
   - Push new booking notifications
   - Update ticket counts in real-time
   - Check-in notifications

Include proper authorization (organizers can only see their own data).
"""
```

### Sprint 14: Admin Panel & Testing

#### Admin Panel

```bash
claude code

# Prompt:
"""
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
"""
```

#### Comprehensive Testing

```bash
claude code

# Prompt:
"""
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
"""
```

---

## Code Structure

### Backend Structure

```
backend/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   ├── permissions.py
│   │   ├── services.py
│   │   ├── signals.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── events/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── public_views.py
│   │   ├── admin.py
│   │   ├── services.py
│   │   ├── filters.py
│   │   ├── signals.py
│   │   ├── urls.py
│   │   ├── utils/
│   │   │   └── geocoding.py
│   │   └── tests/
│   ├── bookings/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   ├── services.py
│   │   ├── ticket_service.py
│   │   ├── signals.py
│   │   ├── tasks.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── payments/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   ├── mpesa_service.py
│   │   ├── stripe_service.py
│   │   ├── tasks.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── analytics/
│   │   ├── __init__.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   └── notifications/
│       ├── __init__.py
│       ├── email_service.py
│       ├── sms_service.py
│       ├── tasks.py
│       └── tests/
├── core/
│   ├── __init__.py
│   ├── exceptions.py
│   ├── pagination.py
│   ├── permissions.py
│   └── utils.py
├── templates/
│   ├── emails/
│   │   ├── base.html
│   │   ├── welcome.html
│   │   ├── verification.html
│   │   ├── ticket.html
│   │   └── reminder.html
│   └── tickets/
│       └── ticket_template.html
├── static/
│   └── admin/
├── media/
│   ├── events/
│   ├── logos/
│   └── qrcodes/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── factories.py
│   └── fixtures/
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── .env
├── .env.example
├── .gitignore
├── celery.py
├── pytest.ini
├── .coveragerc
└── README.md
```

### Frontend Structure

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   └── booking/
│   │       └── [reference]/
│   │           └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── events/
│   │   ├── bookings/
│   │   ├── reports/
│   │   └── settings/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── organizers/
│   │   ├── events/
│   │   └── transactions/
│   └── api/ (API routes if needed)
├── components/
│   ├── ui/ (shadcn components)
│   ├── events/
│   ├── checkout/
│   ├── dashboard/
│   └── admin/
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useEvents.ts
│   └── useBooking.ts
├── types/
│   └── index.ts
├── styles/
│   └── globals.css
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── package.json
└── tailwind.config.ts
```

---

## Testing Strategy

### Running Tests

```bash
# Backend tests
cd backend

# Install test dependencies
pip install pytest pytest-django pytest-cov factory-boy faker

# Run all tests
pytest

# Run specific test file
pytest apps/bookings/tests/test_services.py

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test class
pytest apps/users/tests/test_auth.py::TestUserAuthentication

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Verbose output
pytest -v

# Frontend tests
cd frontend

# Component tests
npm run test

# E2E with Playwright
npm run test:e2e

# Prompt Claude for specific tests:
claude code

# Example prompt:
"""
Write pytest tests for bookings/services.py BookingService class that cover:
1. Creating a booking with valid data
2. Handling sold-out tickets (raises ValidationError)
3. Applying promo codes correctly (test percentage and fixed discounts)
4. Calculating totals with multiple ticket types
5. Handling concurrent bookings (test race conditions using database transactions)
6. Inventory locking and release

Use pytest fixtures, factory_boy for model factories, mock external API calls.
Include both positive and negative test cases.
Test file should be: apps/bookings/tests/test_services.py
"""
```

---

## Deployment Guide

### Pre-Deployment Checklist

```bash
# 1. Environment variables
cp .env.example .env.production
# Fill in production values

# 2. Install production dependencies
pip install -r requirements/production.txt

# 3. Collect static files
python manage.py collectstatic --noinput

# 4. Run database migrations
python manage.py migrate --settings=config.settings.production

# 5. Create superuser (for admin access)
python manage.py createsuperuser --settings=config.settings.production

# 6. Run security checks
python manage.py check --deploy --settings=config.settings.production

# 7. Build frontend
cd frontend
npm run build

# 8. Run security audit
pip-audit
npm audit fix

# 9. Test production settings locally
python manage.py runserver --settings=config.settings.production

# 10. Verify all environment variables are set
python manage.py shell --settings=config.settings.production
>>> from django.conf import settings
>>> print(settings.SECRET_KEY)  # Should be set
>>> print(settings.DEBUG)  # Should be False
```

### Deploy to AWS EC2

```bash
# SSH into server
ssh -i your-key.pem ubuntu@your-server-ip

# Install dependencies
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3-pip postgresql redis-server nginx

# Install supervisor for process management
sudo apt install -y supervisor

# Clone repository
git clone your-repo-url
cd your-repo/backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements/production.txt

# Setup environment
cp .env.example .env
nano .env  # Fill in production values

# Run migrations
python manage.py migrate --settings=config.settings.production

# Collect static files
python manage.py collectstatic --noinput --settings=config.settings.production

# Create superuser
python manage.py createsuperuser --settings=config.settings.production

# Setup Gunicorn
pip install gunicorn

# Create Gunicorn systemd service
sudo nano /etc/systemd/system/event-api.service

# Add configuration:
"""
[Unit]
Description=Event Management API
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/your-repo/backend
Environment="PATH=/home/ubuntu/your-repo/backend/venv/bin"
ExecStart=/home/ubuntu/your-repo/backend/venv/bin/gunicorn \\
    --workers 3 \\
    --bind 0.0.0.0:8000 \\
    --timeout 120 \\
    config.wsgi:application

[Install]
WantedBy=multi-user.target
"""

# Start Gunicorn service
sudo systemctl start event-api
sudo systemctl enable event-api
sudo systemctl status event-api

# Setup Celery worker
sudo nano /etc/systemd/system/celery.service

"""
[Unit]
Description=Celery Worker
After=network.target

[Service]
Type=forking
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/your-repo/backend
Environment="PATH=/home/ubuntu/your-repo/backend/venv/bin"
ExecStart=/home/ubuntu/your-repo/backend/venv/bin/celery -A config worker -l info

[Install]
WantedBy=multi-user.target
"""

sudo systemctl start celery
sudo systemctl enable celery

# Setup Celery Beat for scheduled tasks
sudo nano /etc/systemd/system/celerybeat.service

"""
[Unit]
Description=Celery Beat
After=network.target

[Service]
Type=simple
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/your-repo/backend
Environment="PATH=/home/ubuntu/your-repo/backend/venv/bin"
ExecStart=/home/ubuntu/your-repo/backend/venv/bin/celery -A config beat -l info

[Install]
WantedBy=multi-user.target
"""

sudo systemctl start celerybeat
sudo systemctl enable celerybeat

# Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/event-api

# Add configuration:
"""
upstream event_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    client_max_body_size 10M;

    location /static/ {
        alias /home/ubuntu/your-repo/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/your-repo/backend/media/;
    }

    location / {
        proxy_pass http://event_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
"""

sudo ln -s /etc/nginx/sites-available/event-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL certificate with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE event_management_db;
CREATE USER event_user WITH PASSWORD 'your_secure_password';
ALTER ROLE event_user SET client_encoding TO 'utf8';
ALTER ROLE event_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE event_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE event_management_db TO event_user;
\q

# Configure Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Setup log rotation
sudo nano /etc/logrotate.d/event-api

"""
/home/ubuntu/your-repo/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu www-data
    sharedscripts
}
"""
```

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
```

### Monitoring Setup

```bash
claude code

# Prompt:
"""
Create monitoring setup for production:

1. Implement health check endpoint:
   - GET /health (check API status)
   - GET /health/db (check database connection)
   - GET /health/redis (check Redis connection)

2. Set up Sentry error tracking:
   - Install Sentry SDK
   - Configure error reporting
   - Set up source maps for stack traces

3. Create logging strategy:
   - Use Winston or Pino for structured logging
   - Log levels (error, warn, info, debug)
   - Log rotation

4. Implement performance monitoring:
   - Response time tracking
   - Database query performance
   - API endpoint metrics

5. Create alerting rules:
   - Email alerts for critical errors
   - Slack integration for warnings
   - Uptime monitoring
"""
```

---

## Useful Claude Code Prompts

### For Debugging

```bash
claude code

# Debugging prompt:
"""
I'm getting an error when initiating M-Pesa STK Push:
[paste error message]

Current code:
[paste relevant code]

Help me debug this issue and provide a fix.
"""
```

### For Code Review

```bash
claude code

# Code review prompt:
"""
Review the following code for:
1. Security vulnerabilities
2. Performance issues
3. Best practices
4. Error handling
5. TypeScript type safety

[paste code]

Provide specific suggestions for improvement.
"""
```

### For Documentation

```bash
claude code

# Documentation prompt:
"""
Generate comprehensive API documentation for the following endpoints:

[list endpoints or paste controller code]

Include:
- Endpoint description
- Request parameters
- Request body schema
- Response schema
- Error responses
- Example requests/responses

Use OpenAPI/Swagger format.
"""
```

---

## Quick Reference Commands

### Database

```bash
# Create migration
python manage.py makemigrations

# Create migration with name
python manage.py makemigrations --name add_ticket_status_field

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations

# Revert migration
python manage.py migrate app_name migration_name

# Reset database (dev only - DANGEROUS)
python manage.py flush

# Create database backup
pg_dump -U event_user event_management_db > backup.sql

# Restore database
psql -U event_user event_management_db < backup.sql

# Django shell (for database queries)
python manage.py shell

# Django shell plus (enhanced shell)
pip install django-extensions
python manage.py shell_plus
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/ticket-generation
git add .
git commit -m "feat: implement ticket generation with QR codes"
git push origin feature/ticket-generation

# After code review, merge to main
git checkout main
git merge feature/ticket-generation
git push origin main
```

### Server Management

```bash
# Check Django service logs
sudo journalctl -u event-api -f

# Check Celery logs
sudo journalctl -u celery -f

# Check Celery Beat logs
sudo journalctl -u celerybeat -f

# Restart Django service
sudo systemctl restart event-api

# Restart Celery
sudo systemctl restart celery

# Restart Celery Beat
sudo systemctl restart celerybeat

# Restart all services
sudo systemctl restart event-api celery celerybeat

# Check service status
sudo systemctl status event-api
sudo systemctl status celery
sudo systemctl status celerybeat

# View Django logs
tail -f /home/ubuntu/your-repo/backend/logs/django.log

# View Celery logs
tail -f /home/ubuntu/your-repo/backend/logs/celery.log

# Monitor Redis
redis-cli monitor

# Check Redis memory
redis-cli info memory

# Django management commands
cd /home/ubuntu/your-repo/backend
source venv/bin/activate
python manage.py shell
python manage.py dbshell
```

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

## Django-Specific Best Practices

### Settings Management
```python
# config/settings/base.py - Common settings
# config/settings/development.py - Dev overrides
# config/settings/production.py - Production overrides

# Run with specific settings:
python manage.py runserver --settings=config.settings.development
```

### Celery Configuration
```python
# celery.py in project root
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('event_management')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### Custom Management Commands
```bash
# Create command: apps/bookings/management/commands/send_reminders.py
python manage.py send_reminders

# Useful for cron jobs and automation
```

### Django Admin Customization
```python
# apps/events/admin.py
from django.contrib import admin
from .models import Event, TicketType

class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'start_datetime', 'status']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description']
    inlines = [TicketTypeInline]
    prepopulated_fields = {'slug': ('title',)}
```

### Database Query Optimization
```python
# Use select_related for foreign keys
events = Event.objects.select_related('organizer').all()

# Use prefetch_related for reverse foreign keys and many-to-many
events = Event.objects.prefetch_related('ticket_types').all()

# Use only() to fetch specific fields
events = Event.objects.only('title', 'start_datetime').all()

# Use defer() to exclude fields
events = Event.objects.defer('description').all()

# Aggregate and annotate
from django.db.models import Count, Sum
Event.objects.annotate(
    ticket_count=Count('ticket_types'),
    total_sales=Sum('bookings__final_amount')
)
```

---

## Support & Troubleshooting

### Common Django Issues

**Migration conflicts:**
```bash
# Show migration status
python manage.py showmigrations

# Fix conflicts
python manage.py makemigrations --merge
```

**Static files not loading:**
```bash
# Collect static files
python manage.py collectstatic --clear --noinput

# Check STATIC_ROOT and STATIC_URL in settings
```

**Celery tasks not running:**
```bash
# Check Celery worker is running
sudo systemctl status celery

# Check Redis connection
redis-cli ping

# View task queue
from celery import current_app
current_app.control.inspect().active()
```

**Database connection errors:**
```bash
# Test connection
python manage.py dbshell

# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
```

---

## Support & Troubleshooting

### Common Issues

**M-Pesa STK Push fails:**
- Check if shortcode and passkey are correct
- Verify timestamp format
- Ensure callback URL is publicly accessible
- Check if phone number is registered for M-Pesa

**Database connection errors:**
- Verify PostgreSQL is running
- Check connection string in .env
- Ensure database user has correct permissions

**Email not sending:**
- Verify SendGrid API key
- Check email templates are correctly formatted
- Ensure "from" email is verified

**Frontend not connecting to API:**
- Check CORS configuration
- Verify API URL in frontend .env
- Check network tab in browser dev tools

---

**Document Version**: 1.0
**Last Updated**: December 15, 2025
**Project**: TukioHub - Kenyan Event Management System
**For**: Claude Code CLI Implementation

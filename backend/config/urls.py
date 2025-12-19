"""
URL configuration for TukioHub project
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator
import logging

logger = logging.getLogger(__name__)


class CustomSchemaGenerator(OpenAPISchemaGenerator):
    """Custom schema generator that excludes nested routes to prevent duplicate parameter errors"""

    def get_endpoints(self, request):
        """Filter out nested router endpoints that cause duplicate parameter errors"""
        endpoints = super().get_endpoints(request)

        # Filter out nested routes that have event_pk in the path
        # These routes work fine in the API but cause issues with Swagger
        filtered_endpoints = {}
        for path, value in endpoints.items():
            # Exclude nested routes containing these patterns
            # e.g., /api/events/{id}/tickets/{id}/, /api/events/{event_pk}/promo-codes/, etc.
            exclude_patterns = [
                'tickets',
                'promo-codes',
                'promo_codes',
                'addons',
                'event_pk',  # Nested router parameter
                'upload_images',  # Custom action that might cause issues
            ]

            if any(pattern in path for pattern in exclude_patterns):
                continue

            filtered_endpoints[path] = value

        return filtered_endpoints

    def get_operation(self, view, path, prefix, method, components, request):
        """Override to catch duplicate parameter errors and skip problematic endpoints"""
        try:
            return super().get_operation(view, path, prefix, method, components, request)
        except AssertionError as e:
            if "duplicate Parameters found" in str(e):
                logger.warning(f"Skipping endpoint {method} {path} due to duplicate parameters")
                return None
            raise


# Swagger/OpenAPI Schema with JWT Authentication
schema_view = get_schema_view(
    openapi.Info(
        title="TukioHub API",
        default_version='v1',
        description="""
        TukioHub - Kenyan Event Management System API Documentation

        ## Authentication

        This API uses JWT (JSON Web Token) authentication.

        ### How to authenticate in Swagger UI:

        1. **Login** via the `/api/auth/login/` endpoint:
           - Click "Try it out"
           - Enter your email and password
           - Click "Execute"
           - Copy the `access` token from the response

        2. **Authorize**:
           - Click the **Authorize** button (🔓 or green lock icon) at the top
           - In the "Value" field, enter: **`Bearer `** followed by your token
           - **IMPORTANT**: You must type the word "Bearer" with a space after it!
           - Example: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`
           - Click **Authorize**, then **Close**

        3. **Test endpoints**:
           - All authenticated endpoints will now work
           - Lock icons (🔒) indicate which endpoints require authentication

        ### Common Issues:

        - **"Authentication credentials not provided"** → You forgot to include "Bearer " before the token
        - **"Invalid token"** → Token expired or incorrect format
        - **Token format**: `Bearer <space> <your_token_here>`
        """,
        terms_of_service="https://www.tukiohub.com/terms/",
        contact=openapi.Contact(email="support@tukiohub.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    generator_class=CustomSchemaGenerator,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.events.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/analytics/', include('apps.analytics.urls')),

    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Django Debug Toolbar
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

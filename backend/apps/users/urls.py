"""
URL configuration for users app
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    EmailVerificationView,
    ProfileImageUploadView,
    DocumentUploadView,
    OrganizerDashboardView
)
from .admin_views import (
    AdminOrganizerListView,
    AdminOrganizerDetailView,
    OrganizerApprovalView,
    AdminDashboardView,
    AdminAnalyticsView
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user-profile'),

    # Password Reset
    path('auth/forgot-password/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/reset-password/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Email Verification
    path('auth/verify-email/', EmailVerificationView.as_view(), name='email-verification'),

    # Profile Management
    path('auth/upload-logo/', ProfileImageUploadView.as_view(), name='upload-logo'),
    path('auth/upload-document/', DocumentUploadView.as_view(), name='upload-document'),

    # Organizer Dashboard
    path('organizer/dashboard/', OrganizerDashboardView.as_view(), name='organizer-dashboard'),

    # Admin Routes
    path('admin/organizers/', AdminOrganizerListView.as_view(), name='admin-organizers-list'),
    path('admin/organizers/<uuid:pk>/', AdminOrganizerDetailView.as_view(), name='admin-organizer-detail'),
    path('admin/organizers/<uuid:pk>/approve-reject/', OrganizerApprovalView.as_view(), name='admin-organizer-approval'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
]

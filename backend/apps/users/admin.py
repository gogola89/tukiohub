"""
Admin configuration for users app
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, PasswordReset, EmailVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""

    list_display = ['email', 'role', 'verification_status', 'email_verified', 'is_active', 'created_at']
    list_filter = ['role', 'verification_status', 'email_verified', 'is_active', 'created_at']
    search_fields = ['email', 'company_name', 'phone_number']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('company_name', 'phone_number', 'logo')}),
        (_('Permissions'), {
            'fields': ('role', 'verification_status', 'email_verified', 'is_active', 'is_staff', 'is_superuser',
                      'groups', 'user_permissions'),
        }),
        (_('Verification'), {'fields': ('verification_documents',)}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'phone_number', 'role'),
        }),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login']


@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    """Admin configuration for PasswordReset model"""

    list_display = ['user', 'used', 'expires_at', 'created_at']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    """Admin configuration for EmailVerification model"""

    list_display = ['user', 'used', 'expires_at', 'created_at']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

"""
Admin configuration for users app
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Attendee, PasswordReset, EmailVerification, WalletTransaction


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



@admin.register(Attendee)
class AttendeeAdmin(admin.ModelAdmin):
    """Admin configuration for Attendee model"""

    list_display = ['email', 'full_name', 'role', 'wallet_balance', 'email_verified', 'is_active', 'created_at']
    list_filter = ['role', 'email_verified', 'phone_verified', 'is_active', 'is_subscribed', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (_('Account Info'), {'fields': ('role', 'wallet_balance', 'is_subscribed')}),
        (_('Verification'), {'fields': ('email_verified', 'phone_verified')}),
        (_('Status'), {'fields': ('is_active',)}),
        (_('Important dates'), {'fields': ('created_at', 'updated_at')}),
    )

    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        """Hash password if provided"""
        password = form.cleaned_data.get('password')
        if password:
            obj.set_password(password)
        super().save_model(request, obj, form, change)


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    """Admin configuration for WalletTransaction model"""

    list_display = ['attendee', 'transaction_type', 'amount', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['attendee__email', 'attendee__first_name', 'attendee__last_name', 'description']
    ordering = ['-created_at']

    fieldsets = (
        (_('Transaction Info'), {
            'fields': ('attendee', 'transaction_type', 'amount', 'description', 'booking')
        }),
        (_('Timestamp'), {
            'fields': ('created_at',)
        }),
    )

    readonly_fields = ['created_at']


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

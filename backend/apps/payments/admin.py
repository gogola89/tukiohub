"""
Admin interface for payments app
"""

from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin interface for Transaction model"""

    list_display = [
        'transaction_reference',
        'event',
        'amount',
        'payment_method',
        'status',
        'phone_number',
        'created_at'
    ]

    list_filter = [
        'status',
        'payment_method',
        'created_at',
        'updated_at'
    ]

    search_fields = [
        'transaction_reference',
        'mpesa_receipt_number',
        'checkout_request_id',
        'phone_number',
        'event__title'
    ]

    readonly_fields = [
        'id',
        'transaction_reference',
        'checkout_request_id',
        'merchant_request_id',
        'mpesa_receipt_number',
        'stripe_payment_intent_id',
        'result_code',
        'result_description',
        'metadata',
        'created_at',
        'updated_at',
        'completed_at'
    ]

    fieldsets = (
        ('Transaction Information', {
            'fields': (
                'id',
                'transaction_reference',
                'event',
                'booking_reference',
                'amount',
                'payment_method',
                'status'
            )
        }),
        ('Contact Information', {
            'fields': ('phone_number',)
        }),
        ('M-Pesa Details', {
            'fields': (
                'checkout_request_id',
                'merchant_request_id',
                'mpesa_receipt_number'
            )
        }),
        ('Card Payment Details', {
            'fields': ('stripe_payment_intent_id',)
        }),
        ('Result Information', {
            'fields': (
                'result_code',
                'result_description',
                'metadata'
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'completed_at'
            )
        }),
    )

    def has_add_permission(self, request):
        """Disable manual addition of transactions"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable deletion of transactions (for audit purposes)"""
        return False

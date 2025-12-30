"""
Serializers for payments app
"""

from rest_framework import serializers
from .models import Transaction
from apps.events.models import Event
import re


class InitiateMpesaPaymentSerializer(serializers.Serializer):
    """
    Serializer for initiating M-Pesa payment
    """
    event_id = serializers.UUIDField(required=True)
    phone_number = serializers.CharField(required=True, max_length=15)
    amount = serializers.DecimalField(required=True, max_digits=10, decimal_places=2, min_value=1)
    account_reference = serializers.CharField(required=True, max_length=100)
    transaction_desc = serializers.CharField(required=False, max_length=200, default="TukioHub Event Payment")

    def validate_phone_number(self, value):
        """
        Validate phone number is in correct Kenyan format
        Accepts: 0712345678, 712345678, 254712345678, +254712345678
        """
        # Remove spaces and special characters except +
        cleaned = re.sub(r'[^\d+]', '', value)

        # Remove + if present
        if cleaned.startswith('+'):
            cleaned = cleaned[1:]

        # Validate it's a valid Kenyan number
        if cleaned.startswith('254'):
            if len(cleaned) != 12:
                raise serializers.ValidationError("Invalid phone number length for Kenyan number")
        elif cleaned.startswith('0'):
            if len(cleaned) != 10:
                raise serializers.ValidationError("Invalid phone number length")
        elif cleaned.startswith('7') or cleaned.startswith('1'):
            if len(cleaned) != 9:
                raise serializers.ValidationError("Invalid phone number length")
        else:
            raise serializers.ValidationError("Invalid phone number format. Use Kenyan format (0712345678)")

        return value

    def validate_event_id(self, value):
        """Validate event exists and is published"""
        try:
            event = Event.objects.get(id=value)
            if event.status != Event.PUBLISHED:
                raise serializers.ValidationError("Event is not published")
            if event.is_past:
                raise serializers.ValidationError("Cannot make payment for past events")
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found")

        return value

    def validate_amount(self, value):
        """Validate amount is at least 1 KES"""
        if value < 1:
            raise serializers.ValidationError("Amount must be at least 1 KES")
        return value


class TransactionStatusSerializer(serializers.ModelSerializer):
    """
    Serializer for transaction status
    """
    is_successful = serializers.ReadOnlyField()
    is_pending = serializers.ReadOnlyField()
    is_failed = serializers.ReadOnlyField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_reference', 'amount', 'phone_number',
            'payment_method', 'status', 'mpesa_receipt_number',
            'result_code', 'result_description', 'is_successful',
            'is_pending', 'is_failed', 'created_at', 'updated_at',
            'completed_at'
        ]
        read_only_fields = fields


class TransactionListSerializer(serializers.ModelSerializer):
    """
    Serializer for transaction list
    """
    event_title = serializers.CharField(source='event.title', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_reference', 'event_title', 'booking_reference',
            'amount', 'phone_number', 'payment_method', 'status',
            'mpesa_receipt_number', 'created_at'
        ]
        read_only_fields = fields


class TransactionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed transaction view
    """
    event = serializers.SerializerMethodField()
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'event', 'booking_reference', 'transaction_reference',
            'amount', 'phone_number', 'payment_method', 'status',
            'mpesa_receipt_number', 'checkout_request_id',
            'merchant_request_id', 'result_code', 'result_description',
            'metadata', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = fields

    def get_event(self, obj):
        """Get event details"""
        if obj.event:
            return {
                'id': str(obj.event.id),
                'title': obj.event.title,
                'slug': obj.event.slug,
                'start_datetime': obj.event.start_datetime
            }
        return None


class MpesaCallbackSerializer(serializers.Serializer):
    """
    Serializer for M-Pesa callback validation
    Not used for validation in view, but for documentation
    """
    Body = serializers.DictField()

    def validate_Body(self, value):
        """Validate callback body structure"""
        if 'stkCallback' not in value:
            raise serializers.ValidationError("Invalid callback structure")
        return value


class CreateStripePaymentIntentSerializer(serializers.Serializer):
    """
    Serializer for creating Stripe Payment Intent
    """
    event_id = serializers.UUIDField(required=True)
    amount = serializers.DecimalField(required=True, max_digits=10, decimal_places=2, min_value=1)
    account_reference = serializers.CharField(required=True, max_length=100)

    def validate_event_id(self, value):
        """Validate event exists and is published"""
        try:
            event = Event.objects.get(id=value)
            if event.status != Event.PUBLISHED:
                raise serializers.ValidationError("Event is not published")
            if event.is_past:
                raise serializers.ValidationError("Cannot make payment for past events")
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found")
        return value

    def validate_amount(self, value):
        """Validate amount is at least 1 KES"""
        if value < 1:
            raise serializers.ValidationError("Amount must be at least 1 KES")
        return value


class ConfirmStripePaymentSerializer(serializers.Serializer):
    """
    Serializer for confirming Stripe payment
    """
    payment_intent_id = serializers.CharField(required=True, max_length=255)
    transaction_reference = serializers.CharField(required=True, max_length=100)

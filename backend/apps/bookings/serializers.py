"""
Serializers for bookings app
"""

from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .models import Booking, BookingItem, BookingAddOn, Ticket
from apps.events.models import Event, TicketType, PromoCode, EventAddOn


class BookingItemInputSerializer(serializers.Serializer):
    """Serializer for booking item input (ticket selection)"""

    ticket_type_id = serializers.UUIDField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

    def validate_ticket_type_id(self, value):
        """Validate ticket type exists"""
        try:
            TicketType.objects.get(id=value)
        except TicketType.DoesNotExist:
            raise serializers.ValidationError("Ticket type not found.")
        return value


class BookingAddOnInputSerializer(serializers.Serializer):
    """Serializer for add-on input"""

    addon_id = serializers.UUIDField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

    def validate_addon_id(self, value):
        """Validate add-on exists"""
        try:
            EventAddOn.objects.get(id=value)
        except EventAddOn.DoesNotExist:
            raise serializers.ValidationError("Add-on not found.")
        return value


class CreateBookingSerializer(serializers.Serializer):
    """
    Serializer for creating a new booking
    """

    event_id = serializers.UUIDField(required=True)
    # Optional attendee ID for registered users (null for guest checkout)
    attendee_id = serializers.UUIDField(required=False, allow_null=True)
    attendee_name = serializers.CharField(required=True, max_length=255)
    attendee_email = serializers.EmailField(required=True)
    attendee_phone = serializers.CharField(required=True, max_length=15)

    items = BookingItemInputSerializer(many=True, required=True)
    addons = BookingAddOnInputSerializer(many=True, required=False, allow_empty=True)

    promo_code = serializers.CharField(required=False, allow_blank=True, max_length=50)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(
        choices=['MPESA', 'CARD', 'WALLET', 'CASH'],
        required=False,
        default='MPESA'
    )

    def validate_event_id(self, value):
        """Validate event exists and is bookable"""
        try:
            event = Event.objects.get(id=value)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found.")

        if event.status != Event.PUBLISHED:
            raise serializers.ValidationError("Event is not published.")

        if event.is_past:
            raise serializers.ValidationError("Cannot book tickets for past events.")

        return value

    def validate_items(self, value):
        """Validate booking items"""
        if not value:
            raise serializers.ValidationError("At least one ticket type is required.")

        # Check for duplicates
        ticket_type_ids = [item['ticket_type_id'] for item in value]
        if len(ticket_type_ids) != len(set(ticket_type_ids)):
            raise serializers.ValidationError("Duplicate ticket types are not allowed.")

        return value

    def validate_attendee_phone(self, value):
        """Validate phone number format"""
        import re
        # Remove spaces and special characters
        cleaned = re.sub(r'[^\d+]', '', value)

        # Basic validation for Kenyan numbers
        if not cleaned:
            raise serializers.ValidationError("Invalid phone number.")

        return value

    def validate_promo_code(self, value):
        """Validate promo code if provided"""
        if not value:
            return value

        try:
            promo = PromoCode.objects.get(code=value.upper())

            if not promo.is_active:
                raise serializers.ValidationError("Promo code is not active.")

            if not promo.is_valid():
                raise serializers.ValidationError("Promo code has expired.")

            if not promo.can_be_used():
                raise serializers.ValidationError("Promo code usage limit exceeded.")

        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid promo code.")

        return value.upper()

    def validate_attendee_id(self, value):
        """Validate that attendee exists if provided"""
        if value:
            try:
                from apps.users.models import Attendee
                attendee = Attendee.objects.get(id=value)
                return attendee
            except Attendee.DoesNotExist:
                raise serializers.ValidationError("Attendee not found.")
        return None


class BookingItemSerializer(serializers.ModelSerializer):
    """Serializer for booking items"""

    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)

    class Meta:
        model = BookingItem
        fields = [
            'id', 'ticket_type', 'ticket_type_name', 'quantity',
            'price_per_ticket', 'subtotal', 'created_at'
        ]
        read_only_fields = fields


class BookingAddOnSerializer(serializers.ModelSerializer):
    """Serializer for booking add-ons"""

    addon_name = serializers.CharField(source='addon.name', read_only=True)

    class Meta:
        model = BookingAddOn
        fields = [
            'id', 'addon', 'addon_name', 'quantity',
            'price_per_item', 'subtotal', 'created_at'
        ]
        read_only_fields = fields


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for tickets"""

    event = serializers.SerializerMethodField()
    ticket_type = serializers.SerializerMethodField()
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_code', 'attendee_name', 'attendee_email',
            'ticket_type', 'event', 'status', 'booking_reference',
            'checked_in_at', 'checked_in_by', 'qr_code_image',
            'created_at'
        ]
        read_only_fields = fields

    def get_ticket_type(self, obj):
        """Get ticket type details with price"""
        return {
            'id': str(obj.ticket_type.id),
            'name': obj.ticket_type.name,
            'price': float(obj.ticket_type.price)
        }

    def get_event(self, obj):
        """Get event details"""
        event = obj.booking.event
        return {
            'id': str(event.id),
            'title': event.title,
            'slug': event.slug,
            'start_datetime': event.start_datetime,
            'end_datetime': event.end_datetime,
            'venue': event.venue_name
        }


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view"""

    event_title = serializers.CharField(source='event.title', read_only=True)
    total_tickets = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'event_title', 'attendee_name',
            'attendee_email', 'total_tickets', 'final_amount',
            'payment_status', 'status', 'created_at'
        ]
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed booking view"""

    event = serializers.SerializerMethodField()
    items = BookingItemSerializer(many=True, read_only=True)
    addon_items = BookingAddOnSerializer(many=True, read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    total_tickets = serializers.ReadOnlyField()
    promo_code_used = serializers.CharField(source='promo_code.code', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'event', 'attendee_name',
            'attendee_email', 'attendee_phone', 'items', 'addon_items',
            'total_amount', 'discount_amount', 'final_amount',
            'promo_code_used', 'payment_status', 'payment_method',
            'status', 'total_tickets', 'tickets', 'notes',
            'created_at', 'updated_at', 'confirmed_at', 'expires_at'
        ]
        read_only_fields = fields

    def get_event(self, obj):
        """Get event details"""
        return {
            'id': str(obj.event.id),
            'title': obj.event.title,
            'slug': obj.event.slug,
            'start_datetime': obj.event.start_datetime,
            'end_datetime': obj.event.end_datetime,
            'venue_name': obj.event.venue_name,
            'venue_address': obj.event.venue_address
        }


class TicketVerificationSerializer(serializers.Serializer):
    """Serializer for ticket verification"""

    ticket_code = serializers.CharField(required=True, max_length=50)

    def validate_ticket_code(self, value):
        """Validate ticket code exists"""
        try:
            Ticket.objects.get(ticket_code=value.upper())
        except Ticket.DoesNotExist:
            raise serializers.ValidationError("Invalid ticket code.")
        return value.upper()


class TicketCheckInSerializer(serializers.Serializer):
    """Serializer for ticket check-in"""

    checked_in_by = serializers.CharField(required=False, max_length=255, allow_blank=True)


class TicketTransferSerializer(serializers.Serializer):
    """Serializer for ticket transfer"""

    new_attendee_name = serializers.CharField(required=True, max_length=255)
    new_attendee_email = serializers.EmailField(required=True)

    def validate(self, attrs):
        """Validate transfer data"""
        # Ensure new attendee is different
        ticket = self.context.get('ticket')
        if ticket and ticket.attendee_email == attrs['new_attendee_email']:
            raise serializers.ValidationError({
                'new_attendee_email': 'Cannot transfer ticket to the same email address.'
            })
        return attrs


class CancelBookingSerializer(serializers.Serializer):
    """Serializer for booking cancellation"""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)

"""
Serializers for events app
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Event, TicketType, PromoCode, EventAddOn, EventImage
from apps.users.serializers import UserSerializer


class TicketTypeSerializer(serializers.ModelSerializer):
    """Serializer for ticket types"""

    available_quantity = serializers.ReadOnlyField()
    is_available_now = serializers.SerializerMethodField()

    class Meta:
        model = TicketType
        fields = [
            'id', 'event', 'name', 'description', 'price',
            'quantity_available', 'quantity_sold', 'available_quantity',
            'sales_start_date', 'sales_end_date', 'min_purchase', 'max_purchase',
            'is_active', 'is_available_now', 'created_at'
        ]
        read_only_fields = ['id', 'event', 'quantity_sold', 'created_at']

    def get_is_available_now(self, obj):
        """Check if ticket type is currently available"""
        return obj.is_available()

    def validate(self, attrs):
        """Validate ticket type data"""
        if attrs.get('sales_end_date') and attrs.get('sales_start_date'):
            if attrs['sales_end_date'] <= attrs['sales_start_date']:
                raise serializers.ValidationError({
                    'sales_end_date': 'Sales end date must be after sales start date.'
                })

        # Validate that sales period is within reasonable bounds
        # For nested routes, the event will be available in the context
        event = self.context.get('event') or (self.instance.event if self.instance else None)
        if event:
            sales_start_date = attrs.get('sales_start_date')
            sales_end_date = attrs.get('sales_end_date')

            # Sales should start before the event starts
            if sales_start_date and sales_start_date > event.start_datetime:
                raise serializers.ValidationError({
                    'sales_start_date': 'Sales cannot start after event has started.'
                })

            # Sales should end before or when the event starts (to allow ticket sales up to event time)
            if sales_end_date and sales_end_date > event.start_datetime:
                raise serializers.ValidationError({
                    'sales_end_date': 'Sales must end before or when the event starts.'
                })

        # Validate purchase limits
        min_purchase = attrs.get('min_purchase', self.instance.min_purchase if self.instance else 1)
        max_purchase = attrs.get('max_purchase', self.instance.max_purchase if self.instance else 10)

        if max_purchase < min_purchase:
            raise serializers.ValidationError({
                'max_purchase': 'Maximum purchase must be greater than or equal to minimum purchase.'
            })

        return attrs


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for promo codes"""

    is_valid_now = serializers.SerializerMethodField()
    can_be_used_now = serializers.SerializerMethodField()

    class Meta:
        model = PromoCode
        fields = [
            'id', 'event', 'code', 'discount_type', 'discount_value',
            'usage_limit', 'times_used', 'valid_from', 'valid_until',
            'is_active', 'is_valid_now', 'can_be_used_now', 'created_at'
        ]
        read_only_fields = ['id', 'event', 'times_used', 'created_at']

    def get_is_valid_now(self, obj):
        """Check if promo code is valid now"""
        return obj.is_valid()

    def get_can_be_used_now(self, obj):
        """Check if promo code can be used now"""
        return obj.can_be_used()

    def validate_code(self, value):
        """Validate and uppercase promo code"""
        return value.upper()

    def validate(self, attrs):
        """Validate promo code data"""
        if attrs.get('valid_until') and attrs.get('valid_from'):
            if attrs['valid_until'] <= attrs['valid_from']:
                raise serializers.ValidationError({
                    'valid_until': 'Valid until date must be after valid from date.'
                })

        if attrs.get('discount_type') == PromoCode.PERCENTAGE:
            if attrs.get('discount_value', 0) > 100:
                raise serializers.ValidationError({
                    'discount_value': 'Percentage discount cannot exceed 100%.'
                })

        return attrs


class EventAddOnSerializer(serializers.ModelSerializer):
    """Serializer for event add-ons"""

    is_unlimited = serializers.ReadOnlyField()

    class Meta:
        model = EventAddOn
        fields = [
            'id', 'event', 'name', 'description', 'price',
            'quantity_available', 'is_unlimited', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'event', 'created_at']


class EventImageSerializer(serializers.ModelSerializer):
    """Serializer for event images"""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = EventImage
        fields = ['id', 'event', 'image', 'image_url', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        """Get full image URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list view (minimal data)"""

    organizer_name = serializers.CharField(source='organizer.company_name', read_only=True)
    min_price = serializers.ReadOnlyField()
    max_price = serializers.ReadOnlyField()
    is_sold_out = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    featured_image_url = serializers.SerializerMethodField()
    tickets_sold = serializers.IntegerField(read_only=True, default=0)
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, default=0)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'category', 'venue_name', 'venue_address',
            'start_datetime', 'end_datetime', 'featured_image', 'featured_image_url',
            'is_free', 'min_price', 'max_price', 'status', 'organizer_name',
            'is_sold_out', 'is_upcoming', 'tickets_sold', 'revenue', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'tickets_sold', 'revenue']

    def get_featured_image_url(self, obj):
        """Get full featured image URL"""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


class EventDetailSerializer(serializers.ModelSerializer):
    """Serializer for event detail view (complete data with nested relations)"""

    organizer = UserSerializer(read_only=True)
    ticket_types = TicketTypeSerializer(many=True, read_only=True)
    promo_codes = PromoCodeSerializer(many=True, read_only=True)
    addons = EventAddOnSerializer(many=True, read_only=True)
    event_images = EventImageSerializer(many=True, read_only=True)

    min_price = serializers.ReadOnlyField()
    max_price = serializers.ReadOnlyField()
    is_sold_out = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    available_tickets = serializers.ReadOnlyField()
    featured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'organizer', 'title', 'slug', 'description', 'category',
            'venue_name', 'venue_address', 'latitude', 'longitude',
            'start_datetime', 'end_datetime', 'capacity', 'is_free', 'status',
            'featured_image', 'featured_image_url', 'images', 'age_restriction', 'tags',
            'ticket_types', 'promo_codes', 'addons', 'event_images',
            'min_price', 'max_price', 'is_sold_out', 'is_upcoming', 'is_past',
            'available_tickets', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'organizer', 'created_at', 'updated_at']

    def get_featured_image_url(self, obj):
        """Get full featured image URL"""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events"""

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'description', 'category',
            'venue_name', 'venue_address', 'latitude', 'longitude',
            'start_datetime', 'end_datetime', 'capacity', 'is_free', 'status',
            'featured_image', 'images', 'age_restriction', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validate event data"""
        # Validate datetime only if both fields are being updated
        start_datetime = attrs.get('start_datetime')
        end_datetime = attrs.get('end_datetime')

        # If both datetimes are being updated, validate they're in correct order
        if start_datetime is not None and end_datetime is not None:
            if end_datetime <= start_datetime:
                raise serializers.ValidationError({
                    'end_datetime': 'End datetime must be after start datetime.'
                })
        # If only one is being updated, validate against existing instance
        elif self.instance:
            if start_datetime is not None:
                # If end_datetime is being updated in attrs, use that; otherwise use existing
                check_end_datetime = attrs.get('end_datetime') or self.instance.end_datetime
                if check_end_datetime and start_datetime >= check_end_datetime:
                    raise serializers.ValidationError({
                        'start_datetime': 'Start datetime must be before end datetime.'
                    })
            if end_datetime is not None:
                # If start_datetime is being updated in attrs, use that; otherwise use existing
                check_start_datetime = attrs.get('start_datetime') or self.instance.start_datetime
                if check_start_datetime and end_datetime <= check_start_datetime:
                    raise serializers.ValidationError({
                        'end_datetime': 'End datetime must be after start datetime.'
                    })

        # Validate start datetime is in the future (only for new events)
        if not self.instance and 'start_datetime' in attrs and attrs['start_datetime']:
            if attrs['start_datetime'] <= timezone.now():
                raise serializers.ValidationError({
                    'start_datetime': 'Event start time must be in the future.'
                })

        # Validate capacity only if it's being updated
        if 'capacity' in attrs and attrs['capacity'] <= 0:
            raise serializers.ValidationError({
                'capacity': 'Capacity must be greater than zero.'
            })

        # Validate age restriction only if it's being updated
        if 'age_restriction' in attrs and attrs['age_restriction'] is not None:
            if attrs['age_restriction'] < 0 or attrs['age_restriction'] > 100:
                raise serializers.ValidationError({
                    'age_restriction': 'Age restriction must be between 0 and 100.'
                })

        return attrs

    def create(self, validated_data):
        """Create event with organizer from request user"""
        validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)


class EventPublishSerializer(serializers.Serializer):
    """Serializer for publishing an event"""

    def validate(self, attrs):
        """Validate that event can be published"""
        event = self.context.get('event')

        if not event:
            raise serializers.ValidationError('Event not found.')

        if event.status == Event.PUBLISHED:
            raise serializers.ValidationError('Event is already published.')

        if not event.featured_image:
            raise serializers.ValidationError('Featured image is required to publish event.')

        if not event.ticket_types.exists():
            raise serializers.ValidationError('At least one ticket type is required to publish event.')

        if not event.ticket_types.filter(is_active=True).exists():
            raise serializers.ValidationError('At least one active ticket type is required to publish event.')

        return attrs


class ImageUploadSerializer(serializers.Serializer):
    """Serializer for uploading event images"""

    image = serializers.ImageField(required=True)
    order = serializers.IntegerField(required=False, default=0)

    def validate_image(self, value):
        """Validate image file"""
        # Validate file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Image size must not exceed 5MB.')

        # Validate file extension
        allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file extension. Allowed: {', '.join(allowed_extensions)}"
            )

        return value

"""
Admin configuration for events app
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Event, TicketType, PromoCode, EventAddOn, EventImage


class TicketTypeInline(admin.TabularInline):
    """Inline admin for TicketType"""
    model = TicketType
    extra = 0
    fields = ['name', 'price', 'quantity_available', 'quantity_sold', 'available_quantity', 'sales_start_date', 'sales_end_date', 'is_active']
    readonly_fields = ['quantity_sold', 'available_quantity']

    def available_quantity(self, obj):
        """Display available quantity"""
        if obj.id:
            return obj.available_quantity
        return '-'
    available_quantity.short_description = 'Available'


class PromoCodeInline(admin.TabularInline):
    """Inline admin for PromoCode"""
    model = PromoCode
    extra = 0
    fields = ['code', 'discount_type', 'discount_value', 'usage_limit', 'times_used', 'valid_from', 'valid_until', 'is_active']
    readonly_fields = ['times_used']


class EventAddOnInline(admin.TabularInline):
    """Inline admin for EventAddOn"""
    model = EventAddOn
    extra = 0
    fields = ['name', 'price', 'quantity_available', 'is_active']


class EventImageInline(admin.TabularInline):
    """Inline admin for EventImage"""
    model = EventImage
    extra = 0
    fields = ['image_preview', 'image', 'order']
    readonly_fields = ['image_preview']

    def image_preview(self, obj):
        """Display image preview"""
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.image.url)
        return '-'
    image_preview.short_description = 'Preview'


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin configuration for Event model"""

    list_display = [
        'title',
        'organizer_name',
        'category',
        'status',
        'start_datetime',
        'capacity',
        'tickets_sold',
        'is_sold_out',
        'featured_image_preview',
        'created_at'
    ]

    list_filter = [
        'status',
        'category',
        'is_free',
        'start_datetime',
        'created_at'
    ]

    search_fields = [
        'title',
        'description',
        'venue_name',
        'venue_address',
        'organizer__email',
        'organizer__company_name',
        'slug'
    ]

    readonly_fields = [
        'id',
        'slug',
        'featured_image_preview',
        'is_upcoming',
        'is_past',
        'is_sold_out',
        'available_tickets',
        'min_price',
        'max_price',
        'created_at',
        'updated_at',
        'view_on_site_link'
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'organizer',
                'title',
                'slug',
                'description',
                'category',
                'status'
            )
        }),
        ('Event Details', {
            'fields': (
                'start_datetime',
                'end_datetime',
                'capacity',
                'is_free',
                'age_restriction',
                'tags'
            )
        }),
        ('Venue Information', {
            'fields': (
                'venue_name',
                'venue_address',
                'latitude',
                'longitude'
            )
        }),
        ('Media', {
            'fields': (
                'featured_image',
                'featured_image_preview',
                'images'
            )
        }),
        ('Statistics', {
            'fields': (
                'is_upcoming',
                'is_past',
                'is_sold_out',
                'available_tickets',
                'min_price',
                'max_price'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
        ('Actions', {
            'fields': ('view_on_site_link',)
        })
    )

    inlines = [TicketTypeInline, PromoCodeInline, EventAddOnInline, EventImageInline]

    ordering = ['-created_at']
    date_hierarchy = 'start_datetime'

    def organizer_name(self, obj):
        """Display organizer company name"""
        return obj.organizer.company_name or obj.organizer.email
    organizer_name.short_description = 'Organizer'
    organizer_name.admin_order_field = 'organizer__company_name'

    def tickets_sold(self, obj):
        """Display total tickets sold"""
        return sum(tt.quantity_sold for tt in obj.ticket_types.all())
    tickets_sold.short_description = 'Tickets Sold'

    def featured_image_preview(self, obj):
        """Display featured image preview"""
        if obj.featured_image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.featured_image.url)
        return '-'
    featured_image_preview.short_description = 'Featured Image'

    def view_on_site_link(self, obj):
        """Link to view event on public site"""
        if obj.slug:
            return format_html(
                '<a href="/api/public/events/{}/" target="_blank">View Event Details (API)</a>',
                obj.slug
            )
        return '-'
    view_on_site_link.short_description = 'Public View'

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('organizer').prefetch_related('ticket_types', 'promo_codes', 'addons', 'event_images')


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    """Admin configuration for TicketType model"""

    list_display = [
        'name',
        'event_title',
        'price',
        'quantity_available',
        'quantity_sold',
        'available_quantity',
        'sales_period',
        'is_active'
    ]

    list_filter = [
        'name',
        'is_active',
        'sales_start_date'
    ]

    search_fields = [
        'event__title',
        'name',
        'description'
    ]

    readonly_fields = ['id', 'available_quantity', 'created_at']

    fieldsets = (
        ('Ticket Information', {
            'fields': (
                'id',
                'event',
                'name',
                'description',
                'price'
            )
        }),
        ('Inventory', {
            'fields': (
                'quantity_available',
                'quantity_sold',
                'available_quantity'
            )
        }),
        ('Sales Period', {
            'fields': (
                'sales_start_date',
                'sales_end_date',
                'is_active'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    ordering = ['-created_at']

    def event_title(self, obj):
        """Display event title"""
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'

    def sales_period(self, obj):
        """Display sales period"""
        return f"{obj.sales_start_date.strftime('%Y-%m-%d')} to {obj.sales_end_date.strftime('%Y-%m-%d')}"
    sales_period.short_description = 'Sales Period'

    def get_queryset(self, request):
        """Optimize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('event')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    """Admin configuration for PromoCode model"""

    list_display = [
        'code',
        'event_title',
        'discount_display',
        'usage_status',
        'validity_period',
        'is_active',
        'is_valid_now'
    ]

    list_filter = [
        'discount_type',
        'is_active',
        'valid_from',
        'valid_until'
    ]

    search_fields = [
        'code',
        'event__title'
    ]

    readonly_fields = ['id', 'times_used', 'is_valid_now', 'can_be_used_now', 'created_at']

    fieldsets = (
        ('Promo Code Information', {
            'fields': (
                'id',
                'event',
                'code',
                'is_active'
            )
        }),
        ('Discount Details', {
            'fields': (
                'discount_type',
                'discount_value'
            )
        }),
        ('Usage Limits', {
            'fields': (
                'usage_limit',
                'times_used'
            )
        }),
        ('Validity Period', {
            'fields': (
                'valid_from',
                'valid_until',
                'is_valid_now',
                'can_be_used_now'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    ordering = ['-created_at']

    def event_title(self, obj):
        """Display event title"""
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'

    def discount_display(self, obj):
        """Display discount value"""
        if obj.discount_type == PromoCode.PERCENTAGE:
            return f"{obj.discount_value}%"
        else:
            return f"KES {obj.discount_value}"
    discount_display.short_description = 'Discount'

    def usage_status(self, obj):
        """Display usage status"""
        if obj.usage_limit:
            return f"{obj.times_used} / {obj.usage_limit}"
        return f"{obj.times_used} / Unlimited"
    usage_status.short_description = 'Usage'

    def validity_period(self, obj):
        """Display validity period"""
        return f"{obj.valid_from.strftime('%Y-%m-%d')} to {obj.valid_until.strftime('%Y-%m-%d')}"
    validity_period.short_description = 'Valid Period'

    def is_valid_now(self, obj):
        """Display if promo code is valid now"""
        return obj.is_valid()
    is_valid_now.boolean = True
    is_valid_now.short_description = 'Valid Now'

    def can_be_used_now(self, obj):
        """Display if promo code can be used"""
        return obj.can_be_used()
    can_be_used_now.boolean = True
    can_be_used_now.short_description = 'Can Be Used'

    def get_queryset(self, request):
        """Optimize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('event')


@admin.register(EventAddOn)
class EventAddOnAdmin(admin.ModelAdmin):
    """Admin configuration for EventAddOn model"""

    list_display = [
        'name',
        'event_title',
        'price',
        'quantity_display',
        'is_active',
        'created_at'
    ]

    list_filter = [
        'is_active',
        'created_at'
    ]

    search_fields = [
        'name',
        'event__title',
        'description'
    ]

    readonly_fields = ['id', 'is_unlimited', 'created_at']

    fieldsets = (
        ('Add-on Information', {
            'fields': (
                'id',
                'event',
                'name',
                'description',
                'price'
            )
        }),
        ('Inventory', {
            'fields': (
                'quantity_available',
                'is_unlimited',
                'is_active'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    ordering = ['-created_at']

    def event_title(self, obj):
        """Display event title"""
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'

    def quantity_display(self, obj):
        """Display quantity"""
        if obj.is_unlimited:
            return 'Unlimited'
        return obj.quantity_available
    quantity_display.short_description = 'Quantity'

    def get_queryset(self, request):
        """Optimize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('event')


@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    """Admin configuration for EventImage model"""

    list_display = [
        'event_title',
        'image_preview',
        'order',
        'created_at'
    ]

    list_filter = [
        'created_at'
    ]

    search_fields = [
        'event__title'
    ]

    readonly_fields = ['id', 'image_preview', 'created_at']

    fieldsets = (
        ('Image Information', {
            'fields': (
                'id',
                'event',
                'image',
                'image_preview',
                'order'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    ordering = ['event', 'order', '-created_at']

    def event_title(self, obj):
        """Display event title"""
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'

    def image_preview(self, obj):
        """Display image preview"""
        if obj.image:
            return format_html('<img src="{}" width="150" height="150" style="object-fit: cover;" />', obj.image.url)
        return '-'
    image_preview.short_description = 'Preview'

    def get_queryset(self, request):
        """Optimize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('event')

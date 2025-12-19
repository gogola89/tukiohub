"""
Django admin configuration for bookings app
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Booking, BookingItem, BookingAddOn, Ticket


class BookingItemInline(admin.TabularInline):
    """Inline for booking items"""
    model = BookingItem
    extra = 0
    readonly_fields = ['ticket_type', 'quantity', 'price_per_ticket', 'subtotal']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class BookingAddOnInline(admin.TabularInline):
    """Inline for booking add-ons"""
    model = BookingAddOn
    extra = 0
    readonly_fields = ['addon', 'quantity', 'price_per_item', 'subtotal']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class TicketInline(admin.TabularInline):
    """Inline for tickets"""
    model = Ticket
    extra = 0
    readonly_fields = ['ticket_code', 'ticket_type', 'attendee_name', 'attendee_email',
                       'status', 'is_checked_in', 'checked_in_at', 'qr_code_preview']
    can_delete = False
    fields = ['ticket_code', 'ticket_type', 'attendee_name', 'attendee_email',
              'status', 'is_checked_in', 'checked_in_at', 'qr_code_preview']

    def qr_code_preview(self, obj):
        """Display QR code image preview"""
        if obj.qr_code_image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.qr_code_image.url
            )
        return "No QR code"
    qr_code_preview.short_description = "QR Code"

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin interface for Booking model"""

    list_display = [
        'booking_reference',
        'event_link',
        'attendee_name',
        'attendee_email',
        'status_badge',
        'total_amount',
        'final_amount',
        'ticket_count',
        'created_at'
    ]

    list_filter = [
        'status',
        'payment_status',
        'payment_method',
        'created_at',
        'event__category'
    ]

    search_fields = [
        'booking_reference',
        'attendee_name',
        'attendee_email',
        'attendee_phone',
        'event__title'
    ]

    readonly_fields = [
        'booking_reference',
        'event',
        'attendee_name',
        'attendee_email',
        'attendee_phone',
        'total_amount',
        'discount_amount',
        'final_amount',
        'promo_code',
        'payment_status',
        'payment_method',
        'status',
        'expires_at',
        'created_at',
        'updated_at',
        'ticket_count',
        'qr_codes_preview'
    ]

    fieldsets = [
        ('Booking Information', {
            'fields': [
                'booking_reference',
                'event',
                'status',
                'expires_at',
                'created_at',
                'updated_at'
            ]
        }),
        ('Attendee Information', {
            'fields': [
                'attendee_name',
                'attendee_email',
                'attendee_phone',
                'notes'
            ]
        }),
        ('Payment Information', {
            'fields': [
                'total_amount',
                'discount_amount',
                'final_amount',
                'promo_code',
                'payment_status',
                'payment_method'
            ]
        }),
        ('Tickets', {
            'fields': ['ticket_count']
        })
    ]

    inlines = [BookingItemInline, BookingAddOnInline, TicketInline]

    date_hierarchy = 'created_at'

    actions = ['cancel_bookings', 'send_confirmation_emails']

    def event_link(self, obj):
        """Link to event admin page"""
        url = reverse('admin:events_event_change', args=[obj.event.id])
        return format_html('<a href="{}">{}</a>', url, obj.event.title)
    event_link.short_description = "Event"

    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            Booking.STATUS_PENDING: '#FFA500',  # Orange
            Booking.STATUS_CONFIRMED: '#4CAF50',  # Green
            Booking.STATUS_CANCELLED: '#F44336',  # Red
            Booking.STATUS_EXPIRED: '#9E9E9E',  # Gray
        }
        color = colors.get(obj.status, '#000000')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def ticket_count(self, obj):
        """Display number of tickets"""
        count = obj.tickets.count()
        return f"{count} ticket(s)"
    ticket_count.short_description = "Tickets Generated"

    def qr_codes_preview(self, obj):
        """Display all QR codes for the booking"""
        tickets = obj.tickets.all()
        if not tickets:
            return "No tickets generated yet"

        html = ""
        for ticket in tickets:
            if ticket.qr_code_image:
                html += f'<div style="display: inline-block; margin: 5px; text-align: center;">'
                html += f'<img src="{ticket.qr_code_image.url}" style="max-width: 150px; max-height: 150px;" /><br>'
                html += f'<small>{ticket.ticket_code}</small></div>'

        return format_html(html) if html else "No QR codes"
    qr_codes_preview.short_description = "QR Codes"

    def cancel_bookings(self, request, queryset):
        """Bulk action to cancel bookings"""
        from .services import BookingService

        cancelled_count = 0
        for booking in queryset:
            if booking.status in [Booking.STATUS_PENDING, Booking.STATUS_CONFIRMED]:
                try:
                    BookingService.cancel_booking(booking.id, reason="Cancelled by admin")
                    cancelled_count += 1
                except Exception as e:
                    self.message_user(request, f"Error cancelling {booking.booking_reference}: {str(e)}", level='ERROR')

        self.message_user(request, f"Successfully cancelled {cancelled_count} booking(s).")
    cancel_bookings.short_description = "Cancel selected bookings"

    def send_confirmation_emails(self, request, queryset):
        """Bulk action to resend confirmation emails"""
        from apps.notifications.email_service import EmailService

        sent_count = 0
        for booking in queryset.filter(status=Booking.STATUS_CONFIRMED):
            tickets = list(booking.tickets.all())
            if tickets:
                if EmailService.send_booking_confirmation(booking, tickets):
                    sent_count += 1

        self.message_user(request, f"Successfully sent {sent_count} confirmation email(s).")
    send_confirmation_emails.short_description = "Resend confirmation emails"

    def has_add_permission(self, request):
        """Disable manual booking creation via admin"""
        return False


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Admin interface for Ticket model"""

    list_display = [
        'ticket_code',
        'booking_link',
        'event_link',
        'ticket_type',
        'attendee_name',
        'status_badge',
        'is_checked_in',
        'checked_in_at'
    ]

    list_filter = [
        'status',
        'ticket_type',
        'booking__event__category',
        'created_at'
    ]

    search_fields = [
        'ticket_code',
        'attendee_name',
        'attendee_email',
        'booking__booking_reference',
        'booking__event__title'
    ]

    readonly_fields = [
        'ticket_code',
        'booking',
        'ticket_type',
        'attendee_name',
        'attendee_email',
        'status',
        'is_checked_in',
        'checked_in_at',
        'checked_in_by',
        'qr_code_preview',
        'created_at',
        'updated_at'
    ]

    fieldsets = [
        ('Ticket Information', {
            'fields': [
                'ticket_code',
                'booking',
                'ticket_type',
                'status',
                'created_at',
                'updated_at'
            ]
        }),
        ('Attendee Information', {
            'fields': [
                'attendee_name',
                'attendee_email'
            ]
        }),
        ('Check-in Information', {
            'fields': [
                'is_checked_in',
                'checked_in_at',
                'checked_in_by'
            ]
        }),
        ('QR Code', {
            'fields': ['qr_code_preview']
        })
    ]

    date_hierarchy = 'created_at'

    actions = ['check_in_tickets', 'cancel_tickets']

    def booking_link(self, obj):
        """Link to booking admin page"""
        url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
        return format_html('<a href="{}">{}</a>', url, obj.booking.booking_reference)
    booking_link.short_description = "Booking"

    def event_link(self, obj):
        """Link to event admin page"""
        url = reverse('admin:events_event_change', args=[obj.booking.event.id])
        return format_html('<a href="{}">{}</a>', url, obj.booking.event.title)
    event_link.short_description = "Event"

    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            Ticket.ACTIVE: '#4CAF50',  # Green
            Ticket.USED: '#2196F3',  # Blue
            Ticket.CANCELLED: '#F44336',  # Red
            Ticket.TRANSFERRED: '#FF9800',  # Orange
        }
        color = colors.get(obj.status, '#000000')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def qr_code_preview(self, obj):
        """Display QR code image preview"""
        if obj.qr_code_image:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" /><br><strong>{}</strong>',
                obj.qr_code_image.url,
                obj.ticket_code
            )
        return "No QR code"
    qr_code_preview.short_description = "QR Code"

    def check_in_tickets(self, request, queryset):
        """Bulk action to check in tickets"""
        checked_in_count = 0
        for ticket in queryset.filter(status=Ticket.ACTIVE, is_checked_in=False):
            try:
                ticket.check_in(checked_in_by=request.user.email)
                checked_in_count += 1
            except Exception as e:
                self.message_user(request, f"Error checking in {ticket.ticket_code}: {str(e)}", level='ERROR')

        self.message_user(request, f"Successfully checked in {checked_in_count} ticket(s).")
    check_in_tickets.short_description = "Check in selected tickets"

    def cancel_tickets(self, request, queryset):
        """Bulk action to cancel tickets"""
        cancelled_count = 0
        for ticket in queryset.filter(status=Ticket.ACTIVE):
            try:
                ticket.cancel()
                cancelled_count += 1
            except Exception as e:
                self.message_user(request, f"Error cancelling {ticket.ticket_code}: {str(e)}", level='ERROR')

        self.message_user(request, f"Successfully cancelled {cancelled_count} ticket(s).")
    cancel_tickets.short_description = "Cancel selected tickets"

    def has_add_permission(self, request):
        """Disable manual ticket creation via admin"""
        return False

"""
Analytics service for generating reports and insights
"""

from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import csv
import io
from typing import Dict, List, Optional

from apps.events.models import Event
from apps.bookings.models import Booking, Ticket
from apps.payments.models import Transaction
from .models import EventAnalytics, OrganizerAnalytics


class AnalyticsService:
    """Service for generating analytics and reports"""

    @staticmethod
    def get_event_overview(event_id: str) -> Dict:
        """
        Get comprehensive overview for an event
        
        Returns:
            Dict with all key metrics for the event
        """
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return {}

        # Get booking stats
        bookings = Booking.objects.filter(event=event)
        confirmed_bookings = bookings.filter(status=Booking.STATUS_CONFIRMED)

        # Get ticket stats
        tickets = Ticket.objects.filter(booking__event=event)
        checked_in_tickets = tickets.filter(status=Ticket.USED)

        # Get revenue stats
        revenue_data = confirmed_bookings.aggregate(
            total_revenue=Sum('final_amount'),
            total_gross=Sum('total_amount'),
            total_discounts=Sum('discount_amount')
        )

        # Payment method breakdown
        mpesa_revenue = confirmed_bookings.filter(
            payment_method=Booking.MPESA
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')

        card_revenue = confirmed_bookings.filter(
            payment_method=Booking.CARD
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')

        # Ticket type breakdown
        ticket_types_sold = {}
        for ticket_type in event.ticket_types.all():
            quantity = tickets.filter(ticket_type=ticket_type).count()
            revenue = Booking.objects.filter(
                event=event,
                status=Booking.STATUS_CONFIRMED,
                items__ticket_type=ticket_type
            ).aggregate(
                total=Sum(F('items__subtotal'))
            )['total'] or Decimal('0')

            ticket_types_sold[ticket_type.name] = {
                'quantity': quantity,
                'revenue': float(revenue),
                'price': float(ticket_type.price)
            }

        # Promo code usage
        promo_usage = {}
        for promo_code in event.promo_codes.all():
            usage_count = confirmed_bookings.filter(promo_code=promo_code).count()
            discount_total = confirmed_bookings.filter(
                promo_code=promo_code
            ).aggregate(total=Sum('discount_amount'))['total'] or Decimal('0')

            if usage_count > 0:
                promo_usage[promo_code.code] = {
                    'count': usage_count,
                    'discount_total': float(discount_total)
                }

        # Build ticket_type_breakdown array for frontend charts
        ticket_type_breakdown = [
            {
                'ticket_type': name,
                'quantity_sold': info['quantity'],
                'revenue': info['revenue'],
            }
            for name, info in ticket_types_sold.items()
        ]

        net_revenue = float(revenue_data['total_revenue'] or 0)

        return {
            'event_id': str(event.id),
            'event_title': event.title,
            'event_status': event.status,
            'start_datetime': event.start_datetime.isoformat(),

            # Booking metrics
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed_bookings.count(),
            'pending_bookings': bookings.filter(status=Booking.STATUS_PENDING).count(),
            'cancelled_bookings': bookings.filter(status=Booking.STATUS_CANCELLED).count(),

            # Ticket metrics
            'total_tickets': tickets.count(),
            'tickets_checked_in': checked_in_tickets.count(),
            'check_in_rate': round((checked_in_tickets.count() / tickets.count() * 100) if tickets.count() > 0 else 0, 2),

            # Revenue metrics
            'gross_revenue': float(revenue_data['total_gross'] or 0),
            'net_revenue': net_revenue,
            'total_revenue': net_revenue,  # Alias for frontend compatibility
            'total_discounts': float(revenue_data['total_discounts'] or 0),

            # Frontend-compatible fields
            'total_attendees': confirmed_bookings.count(),
            'tickets_sold': tickets.count(),

            # Payment methods
            'mpesa_revenue': float(mpesa_revenue),
            'card_revenue': float(card_revenue),

            # Breakdowns
            'ticket_types': ticket_types_sold,
            'ticket_type_breakdown': ticket_type_breakdown,
            'promo_codes': promo_usage,

            # Capacity metrics
            'capacity': event.capacity or 0,
            'tickets_available': event.capacity - tickets.count() if event.capacity else None,
            'capacity_used_percent': round((tickets.count() / event.capacity * 100) if event.capacity else 0, 2),
        }

    @staticmethod
    def get_sales_timeline(event_id: str, period: str = 'daily') -> List[Dict]:
        """
        Get sales timeline for an event
        
        Args:
            event_id: Event ID
            period: 'hourly', 'daily', or 'weekly'
            
        Returns:
            List of dicts with date and metrics
        """
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return []

        bookings = Booking.objects.filter(
            event=event,
            status=Booking.STATUS_CONFIRMED
        ).order_by('created_at')

        if not bookings.exists():
            return []

        timeline = []
        
        if period == 'daily':
            # Group by day
            current_date = bookings.first().created_at.date()
            end_date = timezone.now().date()
            
            while current_date <= end_date:
                day_bookings = bookings.filter(
                    created_at__date=current_date
                )
                
                timeline.append({
                    'date': current_date.isoformat(),
                    'bookings': day_bookings.count(),
                    'tickets': sum(b.total_tickets for b in day_bookings),
                    'revenue': float(day_bookings.aggregate(total=Sum('final_amount'))['total'] or 0)
                })
                
                current_date += timedelta(days=1)
        
        return timeline

    @staticmethod
    def get_attendee_demographics(event_id: str) -> Dict:
        """
        Get attendee demographics for an event
        
        Returns:
            Dict with demographic insights
        """
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return {}

        bookings = Booking.objects.filter(
            event=event,
            status=Booking.STATUS_CONFIRMED
        )

        # Email domains (to identify corporate/individual bookings)
        email_domains = {}
        for booking in bookings:
            domain = booking.attendee_email.split('@')[-1]
            email_domains[domain] = email_domains.get(domain, 0) + 1

        # Sort domains by count
        top_domains = sorted(email_domains.items(), key=lambda x: x[1], reverse=True)[:10]

        # Booking time distribution (when do people book?)
        booking_hours = [0] * 24
        for booking in bookings:
            hour = booking.created_at.hour
            booking_hours[hour] += 1

        return {
            'total_attendees': bookings.count(),
            'unique_emails': bookings.values('attendee_email').distinct().count(),
            'repeat_customers': bookings.values('attendee_email').annotate(
                count=Count('id')
            ).filter(count__gt=1).count(),
            'top_email_domains': [{'domain': d, 'count': c} for d, c in top_domains],
            'booking_hours_distribution': booking_hours,
            'avg_tickets_per_booking': round(
                bookings.aggregate(avg=Avg('items__quantity'))['avg'] or 0, 2
            ),
        }

    @staticmethod
    def get_organizer_dashboard(organizer_id: str, period_days: int = 30) -> Dict:
        """
        Get dashboard metrics for organizer
        
        Args:
            organizer_id: User ID of organizer
            period_days: Number of days to look back
            
        Returns:
            Dict with organizer metrics
        """
        from apps.users.models import User
        
        try:
            organizer = User.objects.get(id=organizer_id, role='ORGANIZER')
        except User.DoesNotExist:
            return {}

        end_date = timezone.now()
        start_date = end_date - timedelta(days=period_days)

        events = Event.objects.filter(organizer=organizer)
        active_events = events.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now()
        )

        # Get all bookings for organizer's events
        all_bookings = Booking.objects.filter(event__organizer=organizer)
        confirmed_bookings = all_bookings.filter(status=Booking.STATUS_CONFIRMED)
        period_bookings = confirmed_bookings.filter(created_at__gte=start_date)

        # Revenue metrics
        total_revenue = confirmed_bookings.aggregate(
            total=Sum('final_amount')
        )['total'] or Decimal('0')

        period_revenue = period_bookings.aggregate(
            total=Sum('final_amount')
        )['total'] or Decimal('0')

        # Ticket metrics
        total_tickets = Ticket.objects.filter(
            booking__event__organizer=organizer
        ).count()

        period_tickets = Ticket.objects.filter(
            booking__event__organizer=organizer,
            created_at__gte=start_date
        ).count()

        # Count upcoming events
        upcoming_events_count = events.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now()
        ).count()

        return {
            'organizer_id': str(organizer.id),
            'organizer_name': organizer.company_name or organizer.email,
            'period_days': period_days,

            # Event metrics
            'total_events': events.count(),
            'active_events': active_events.count(),
            'upcoming_events_count': upcoming_events_count,
            'draft_events': events.filter(status=Event.DRAFT).count(),
            'completed_events': events.filter(
                status=Event.PUBLISHED,
                end_datetime__lt=timezone.now()
            ).count(),

            # All-time metrics (with frontend-compatible field names)
            'total_bookings': confirmed_bookings.count(),
            'tickets_sold': total_tickets,
            'total_revenue': float(total_revenue),
            'total_attendees': confirmed_bookings.count(),  # Number of unique bookings = attendees

            # Legacy field names for backward compatibility
            'lifetime_bookings': confirmed_bookings.count(),
            'lifetime_tickets': total_tickets,
            'lifetime_revenue': float(total_revenue),

            # Period metrics
            'period_bookings': period_bookings.count(),
            'period_tickets': period_tickets,
            'period_revenue': float(period_revenue),

            # Averages
            'avg_revenue_per_event': float(total_revenue / events.count()) if events.count() > 0 else 0,
            'avg_tickets_per_event': round(total_tickets / events.count(), 2) if events.count() > 0 else 0,
        }

    @staticmethod
    def get_aggregate_sales_timeline(organizer_id: str, period_days: int = 30) -> List[Dict]:
        """
        Get aggregate sales timeline across all organizer events.
        """
        from apps.users.models import User

        try:
            organizer = User.objects.get(id=organizer_id, role='ORGANIZER')
        except User.DoesNotExist:
            return []

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=period_days)

        bookings = Booking.objects.filter(
            event__organizer=organizer,
            status=Booking.STATUS_CONFIRMED,
            created_at__date__gte=start_date,
        ).order_by('created_at')

        if not bookings.exists():
            return []

        timeline = []
        current_date = start_date

        while current_date <= end_date:
            day_bookings = bookings.filter(created_at__date=current_date)
            timeline.append({
                'date': current_date.isoformat(),
                'bookings': day_bookings.count(),
                'tickets': sum(b.total_tickets for b in day_bookings),
                'revenue': float(day_bookings.aggregate(total=Sum('final_amount'))['total'] or 0),
            })
            current_date += timedelta(days=1)

        return timeline

    @staticmethod
    def get_aggregate_ticket_breakdown(organizer_id: str) -> List[Dict]:
        """
        Get aggregate ticket type breakdown across all organizer events.
        """
        from apps.users.models import User

        try:
            organizer = User.objects.get(id=organizer_id, role='ORGANIZER')
        except User.DoesNotExist:
            return []

        tickets = Ticket.objects.filter(
            booking__event__organizer=organizer,
            booking__status=Booking.STATUS_CONFIRMED,
        )

        # Group by ticket type name
        breakdown = {}
        for ticket in tickets.select_related('ticket_type'):
            name = ticket.ticket_type.name
            if name not in breakdown:
                breakdown[name] = {'ticket_type': name, 'quantity_sold': 0, 'revenue': 0}
            breakdown[name]['quantity_sold'] += 1
            breakdown[name]['revenue'] += float(ticket.ticket_type.price)

        return list(breakdown.values())

    @staticmethod
    def export_event_attendees_csv(event_id: str) -> io.StringIO:
        """
        Export event attendees to CSV
        
        Returns:
            StringIO buffer with CSV data
        """
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return io.StringIO()

        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            'Booking Reference',
            'Attendee Name',
            'Attendee Email',
            'Attendee Phone',
            'Ticket Code',
            'Ticket Type',
            'Status',
            'Checked In',
            'Check-in Time',
            'Booking Date',
            'Amount Paid'
        ])

        # Write tickets
        tickets = Ticket.objects.filter(
            booking__event=event
        ).select_related('booking', 'ticket_type').order_by('created_at')

        for ticket in tickets:
            writer.writerow([
                ticket.booking.booking_reference,
                ticket.attendee_name,
                ticket.attendee_email,
                ticket.booking.attendee_phone,
                ticket.ticket_code,
                ticket.ticket_type.name,
                ticket.get_status_display(),
                'Yes' if ticket.is_checked_in else 'No',
                ticket.checked_in_at.isoformat() if ticket.checked_in_at else '',
                ticket.booking.created_at.isoformat(),
                float(ticket.booking.final_amount)
            ])

        output.seek(0)
        return output

    @staticmethod
    def export_event_sales_csv(event_id: str) -> io.StringIO:
        """
        Export event sales report to CSV
        
        Returns:
            StringIO buffer with CSV data
        """
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return io.StringIO()

        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            'Booking Reference',
            'Booking Date',
            'Attendee Name',
            'Attendee Email',
            'Status',
            'Tickets',
            'Ticket Types',
            'Gross Amount',
            'Discount',
            'Final Amount',
            'Payment Method',
            'Promo Code'
        ])

        # Write bookings
        bookings = Booking.objects.filter(
            event=event
        ).prefetch_related('items__ticket_type').order_by('-created_at')

        for booking in bookings:
            ticket_types = ', '.join([
                f"{item.ticket_type.name} x{item.quantity}"
                for item in booking.items.all()
            ])

            writer.writerow([
                booking.booking_reference,
                booking.created_at.isoformat(),
                booking.attendee_name,
                booking.attendee_email,
                booking.get_status_display(),
                booking.total_tickets,
                ticket_types,
                float(booking.total_amount),
                float(booking.discount_amount),
                float(booking.final_amount),
                booking.get_payment_method_display() if booking.payment_method else '',
                booking.promo_code.code if booking.promo_code else ''
            ])

        output.seek(0)
        return output

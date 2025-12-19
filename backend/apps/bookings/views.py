"""
Views for booking management
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
import logging

from .models import Booking, Ticket
from .serializers import (
    CreateBookingSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    TicketSerializer,
    TicketVerificationSerializer,
    TicketCheckInSerializer,
    TicketTransferSerializer
)
from .services import BookingService
from .ticket_service import TicketService

logger = logging.getLogger(__name__)


class CreateBookingAPIView(generics.GenericAPIView):
    """
    Create a new booking

    POST /api/bookings/create/
    """

    serializer_class = CreateBookingSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """Create booking with inventory locking"""
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create booking using service
            booking = BookingService.create_booking(
                event_id=serializer.validated_data['event_id'],
                items_data=serializer.validated_data['items'],
                attendee_info={
                    'attendee_name': serializer.validated_data['attendee_name'],
                    'attendee_email': serializer.validated_data['attendee_email'],
                    'attendee_phone': serializer.validated_data['attendee_phone'],
                    'notes': serializer.validated_data.get('notes', ''),
                },
                promo_code=serializer.validated_data.get('promo_code'),
                addons_data=serializer.validated_data.get('addons', [])
            )

            # Schedule expiration task
            from .tasks import expire_booking_task
            expire_booking_task.apply_async(
                args=[str(booking.id)],
                countdown=BookingService.BOOKING_TIMEOUT_MINUTES * 60
            )

            logger.info(f"Booking created: {booking.booking_reference}")

            # Return booking details
            response_serializer = BookingDetailSerializer(booking)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while creating the booking'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetBookingAPIView(generics.RetrieveAPIView):
    """
    Get booking details by reference

    GET /api/bookings/<booking_reference>/
    """

    serializer_class = BookingDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'booking_reference'

    def get_queryset(self):
        return Booking.objects.all().select_related('event', 'promo_code').prefetch_related(
            'items__ticket_type',
            'addon_items__addon',
            'tickets__ticket_type'
        )


class CancelBookingAPIView(generics.GenericAPIView):
    """
    Cancel a booking

    POST /api/bookings/<booking_reference>/cancel/
    """

    permission_classes = [AllowAny]

    def post(self, request, booking_reference):
        """Cancel booking and release inventory"""
        try:
            booking = Booking.objects.get(booking_reference=booking_reference)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            reason = request.data.get('reason', '')
            booking = BookingService.cancel_booking(booking.id, reason=reason)

            return Response({
                'message': 'Booking cancelled successfully',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyTicketAPIView(generics.GenericAPIView):
    """
    Verify ticket by ticket code

    POST /api/tickets/verify/
    """

    serializer_class = TicketVerificationSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """Verify ticket"""
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket_code = serializer.validated_data['ticket_code']

        try:
            ticket = Ticket.objects.select_related(
                'booking__event',
                'ticket_type'
            ).get(ticket_code=ticket_code)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Invalid ticket code'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Return ticket details
        return Response({
            'valid': True,
            'ticket': TicketSerializer(ticket).data,
            'can_check_in': ticket.status == Ticket.ACTIVE and not ticket.is_checked_in
        }, status=status.HTTP_200_OK)


class CheckInTicketAPIView(generics.GenericAPIView):
    """
    Check-in ticket

    PUT /api/tickets/<ticket_code>/checkin/
    """

    serializer_class = TicketCheckInSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated staff/organizers

    def put(self, request, ticket_code):
        """Check in ticket"""
        try:
            ticket = Ticket.objects.select_related('booking__event').get(ticket_code=ticket_code)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify user is organizer of the event
        if not request.user.is_staff and ticket.booking.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to check in tickets for this event'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            checked_in_by = serializer.validated_data.get('checked_in_by', request.user.email)
            ticket.check_in(checked_in_by=checked_in_by)

            return Response({
                'message': 'Ticket checked in successfully',
                'ticket': TicketSerializer(ticket).data
            }, status=status.HTTP_200_OK)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TransferTicketAPIView(generics.GenericAPIView):
    """
    Transfer ticket to another person

    POST /api/tickets/<ticket_code>/transfer/
    """

    serializer_class = TicketTransferSerializer
    permission_classes = [AllowAny]

    def post(self, request, ticket_code):
        """Transfer ticket"""
        try:
            ticket = Ticket.objects.get(ticket_code=ticket_code)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'ticket': ticket}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            old_email = ticket.attendee_email

            ticket.transfer(
                new_attendee_name=serializer.validated_data['new_attendee_name'],
                new_attendee_email=serializer.validated_data['new_attendee_email']
            )

            # Send notification emails
            from apps.notifications.email_service import EmailService
            EmailService.send_ticket_transfer(ticket, old_email, ticket.attendee_email)

            return Response({
                'message': 'Ticket transferred successfully',
                'ticket': TicketSerializer(ticket).data
            }, status=status.HTTP_200_OK)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DownloadTicketAPIView(generics.GenericAPIView):
    """
    Download ticket PDF

    GET /api/tickets/<ticket_code>/download/
    """

    permission_classes = [AllowAny]

    def get(self, request, ticket_code):
        """Download ticket PDF"""
        try:
            ticket = Ticket.objects.get(ticket_code=ticket_code)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate PDF
        pdf_buffer = TicketService.generate_ticket_pdf(ticket)

        if not pdf_buffer:
            return Response(
                {'error': 'Failed to generate ticket PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Return PDF
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="ticket_{ticket.ticket_code}.pdf"'

        return response

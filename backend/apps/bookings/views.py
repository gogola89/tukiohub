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
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from django.utils import timezone
import logging
import uuid

from .models import Booking, Ticket
from .serializers import (
    CreateBookingSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    TicketSerializer,
    TicketVerificationSerializer,
    TicketCheckInSerializer,
    TicketTransferSerializer,
    CancelBookingSerializer
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
            # Get attendee if provided
            attendee = serializer.validated_data.get('attendee_id')
            payment_method = serializer.validated_data.get('payment_method', 'MPESA')

            # Check if using wallet and attendee exists
            if payment_method == 'WALLET' and not attendee:
                return Response(
                    {'error': 'Attendee ID is required when using wallet payment'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
                attendee=attendee,  # Pass attendee object
                payment_method=payment_method,  # Pass payment method
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


class ConfirmWalletPaymentAPIView(generics.GenericAPIView):
    """
    Confirm booking with wallet payment

    POST /api/bookings/<booking_reference>/confirm-wallet-payment/

    This endpoint confirms a booking that was created with payment_method='WALLET'.
    It will:
    1. Deduct the amount from the attendee's wallet
    2. Confirm the booking
    3. Generate tickets
    4. Send confirmation email

    Requires: Authenticated attendee with sufficient wallet balance
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return None for schema generation"""
        if getattr(self, 'swagger_fake_view', False):
            return None
        return super().get_serializer_class()

    def post(self, request, booking_reference):
        """Confirm wallet payment and complete booking"""
        try:
            # Get booking
            booking = Booking.objects.select_related('event', 'attendee').get(
                booking_reference=booking_reference
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify the booking belongs to the authenticated user
        if booking.attendee != request.user:
            return Response(
                {'error': 'You are not authorized to confirm this booking'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check booking status
        if booking.status != Booking.STATUS_PENDING:
            return Response(
                {'error': f'Booking is not pending. Current status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check payment method
        if booking.payment_method != 'WALLET':
            return Response(
                {'error': 'This endpoint is only for wallet payments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if booking has expired
        if booking.expires_at and booking.expires_at < timezone.now():
            return Response(
                {'error': 'Booking has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Confirm booking (this will deduct from wallet)
            booking = BookingService.confirm_booking(booking.id, payment_method='WALLET')

            # Queue ticket generation and email sending (asynchronous)
            from apps.bookings.tasks import generate_and_send_tickets_task
            generate_and_send_tickets_task.delay(str(booking.id))

            logger.info(f"Wallet payment confirmed for booking {booking.booking_reference}")
            logger.info(f"Ticket generation and email task queued for booking {booking.booking_reference}")

            return Response({
                'message': 'Payment confirmed successfully. Tickets will be sent to your email shortly.',
                'booking': BookingDetailSerializer(booking).data,
            }, status=status.HTTP_200_OK)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error confirming wallet payment: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while processing payment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConfirmCashPaymentAPIView(generics.GenericAPIView):
    """
    Confirm a booking as paid by cash (onsite registration desk)

    POST /api/bookings/<booking_reference>/confirm-cash-payment/

    Only the event's organizer (or staff) may confirm cash payment for a
    booking. Generates tickets synchronously so they can be shown on-screen
    immediately; email/SMS delivery is still queued asynchronously.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return None for schema generation"""
        if getattr(self, 'swagger_fake_view', False):
            return None
        return super().get_serializer_class()

    def post(self, request, booking_reference):
        """Confirm cash payment and complete booking"""
        from apps.payments.models import Transaction

        try:
            booking = Booking.objects.select_related('event').get(
                booking_reference=booking_reference
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not request.user.is_staff and booking.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to confirm payment for this booking'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status != Booking.STATUS_PENDING:
            return Response(
                {'error': f'Cannot confirm payment for booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cash_transaction = Transaction.objects.create(
                event=booking.event,
                booking=booking,
                amount=booking.final_amount,
                payment_method=Transaction.CASH,
                transaction_reference=f"TH{uuid.uuid4().hex[:8].upper()}",
                status=Transaction.COMPLETED,
                completed_at=timezone.now(),
                metadata={'confirmed_by': request.user.email, 'source': 'registration_desk'},
            )

            booking = BookingService.confirm_booking(booking.id, payment_method='CASH')
            booking.transaction_id = str(cash_transaction.id)
            booking.save()

            # Generate tickets now so they can be shown on-screen immediately
            TicketService.generate_tickets_for_booking(booking.id)

            # Queue email/SMS delivery (tickets already exist, so this only sends)
            from .tasks import generate_and_send_tickets_task
            generate_and_send_tickets_task.delay(str(booking.id))

            logger.info(f"Cash payment confirmed for booking {booking.booking_reference} by {request.user.email}")

            booking.refresh_from_db()
            return Response({
                'message': 'Cash payment confirmed. Tickets generated.',
                'booking': BookingDetailSerializer(booking).data,
            }, status=status.HTTP_200_OK)

        except (DjangoValidationError, ValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error confirming cash payment: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while processing payment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CancelBookingAPIView(generics.GenericAPIView):
    """
    Cancel a booking

    POST /api/bookings/<booking_reference>/cancel/
    """

    serializer_class = CancelBookingSerializer
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


class TicketSearchAPIView(generics.ListAPIView):
    """
    Search tickets by code or attendee name, scoped to the organizer's own events

    GET /api/bookings/tickets/search/?q=<query>&event_id=<uuid>
    """

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Ticket.objects.filter(
            booking__event__organizer=self.request.user
        ).select_related('booking__event', 'ticket_type').order_by('-created_at')

        query = self.request.query_params.get('q', '').strip()
        if query:
            queryset = queryset.filter(
                Q(ticket_code__icontains=query) | Q(attendee_name__icontains=query)
            )

        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(booking__event_id=event_id)

        return queryset


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
            first_error = next(iter(serializer.errors.values()))[0]
            return Response(
                {'valid': False, 'message': str(first_error)},
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
                {'valid': False, 'message': 'Invalid ticket code'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Return ticket details
        return Response({
            'valid': True,
            'message': 'Ticket is valid',
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
                {'error': 'Ticket not found', 'message': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify user is organizer of the event
        if not request.user.is_staff and ticket.booking.event.organizer != request.user:
            return Response(
                {
                    'error': 'You do not have permission to check in tickets for this event',
                    'message': 'You do not have permission to check in tickets for this event',
                },
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
                {'error': str(e), 'message': str(e)},
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

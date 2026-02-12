"""
Views for payment processing
"""

from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
import logging

from .models import Transaction
from .serializers import (
    InitiateMpesaPaymentSerializer,
    TransactionStatusSerializer,
    TransactionListSerializer,
    TransactionDetailSerializer,
    MpesaCallbackSerializer,
    CreateStripePaymentIntentSerializer,
    ConfirmStripePaymentSerializer
)
from .mpesa_service import mpesa_service
from apps.events.models import Event
from apps.bookings.models import Booking

logger = logging.getLogger(__name__)


class InitiateMpesaPaymentAPIView(generics.GenericAPIView):
    """
    Initiate M-Pesa STK Push payment

    POST /api/payments/mpesa/initiate/

    Request body:
    {
        "event_id": "uuid",
        "phone_number": "254712345678",
        "amount": 1000.00,
        "account_reference": "EVENT_BOOKING_REF",
        "transaction_desc": "TukioHub Event Payment"
    }
    """

    serializer_class = InitiateMpesaPaymentSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """Initiate M-Pesa payment"""
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract validated data
        event_id = serializer.validated_data['event_id']
        phone_number = serializer.validated_data['phone_number']
        amount = serializer.validated_data['amount']
        account_reference = serializer.validated_data['account_reference']
        transaction_desc = serializer.validated_data.get(
            'transaction_desc',
            'TukioHub Event Payment'
        )

        # Get event
        event = get_object_or_404(Event, id=event_id)

        # Generate unique transaction reference
        transaction_reference = f"TH{uuid.uuid4().hex[:8].upper()}"

        # Try to find a booking by account_reference and link it to the transaction
        booking = None
        try:
            booking = Booking.objects.get(booking_reference=account_reference)
            logger.info(f"Found booking {account_reference} to link to transaction")

            # Check if booking already has a successful transaction
            existing_successful_transaction = Transaction.objects.filter(
                booking=booking,
                status=Transaction.COMPLETED
            ).first()

            if existing_successful_transaction:
                logger.warning(f"Booking {account_reference} already has a successful transaction: {existing_successful_transaction.transaction_reference}")
                return Response({
                    'success': False,
                    'error': 'This booking has already been paid',
                    'transaction_reference': existing_successful_transaction.transaction_reference
                }, status=status.HTTP_400_BAD_REQUEST)

        except Booking.DoesNotExist:
            logger.info(f"No booking found with reference {account_reference}, proceeding without booking link")

        # Create pending transaction
        transaction = Transaction.objects.create(
            event=event,
            amount=amount,
            phone_number=phone_number,
            payment_method=Transaction.MPESA,
            transaction_reference=transaction_reference,
            status=Transaction.PENDING,
            booking=booking,  # Link booking if found
            metadata={
                'account_reference': account_reference,
                'transaction_desc': transaction_desc,
                'initiated_by': request.user.email if request.user.is_authenticated else 'anonymous'
            }
        )

        logger.info(f"Created pending transaction: {transaction_reference}")

        # Initiate STK Push
        mpesa_response = mpesa_service.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=account_reference,
            transaction_desc=transaction_desc
        )

        if mpesa_response.get('success'):
            # Update transaction with M-Pesa details
            transaction.checkout_request_id = mpesa_response.get('checkout_request_id')
            transaction.merchant_request_id = mpesa_response.get('merchant_request_id')
            transaction.save()

            logger.info(f"STK Push initiated successfully for transaction: {transaction_reference}")

            return Response({
                'success': True,
                'message': 'STK Push sent to your phone. Please enter your M-Pesa PIN.',
                'transaction_reference': transaction_reference,
                'checkout_request_id': mpesa_response.get('checkout_request_id'),
                'customer_message': mpesa_response.get('customer_message')
            }, status=status.HTTP_200_OK)
        else:
            # Mark transaction as failed
            transaction.mark_as_failed(
                result_description=mpesa_response.get('error', 'STK Push failed')
            )

            logger.error(f"STK Push failed for transaction: {transaction_reference}")

            return Response({
                'success': False,
                'error': mpesa_response.get('error', 'Payment initiation failed'),
                'transaction_reference': transaction_reference
            }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackAPIView(generics.GenericAPIView):
    """
    M-Pesa callback endpoint
    Receives payment confirmation from Safaricom

    POST /api/payments/mpesa/callback/

    No authentication required (validated using M-Pesa parameters)
    """

    permission_classes = [AllowAny]
    serializer_class = MpesaCallbackSerializer

    def post(self, request):
        """
        Process M-Pesa callback

        Callback structure:
        {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "...",
                    "CheckoutRequestID": "...",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 1000},
                            {"Name": "MpesaReceiptNumber", "Value": "..."},
                            {"Name": "TransactionDate", "Value": 20231215100530},
                            {"Name": "PhoneNumber", "Value": 254712345678}
                        ]
                    }
                }
            }
        }
        """
        logger.info("Received M-Pesa callback")
        logger.debug(f"Callback data: {request.data}")

        try:
            # Extract callback data
            body = request.data.get('Body', {})
            stk_callback = body.get('stkCallback', {})

            if not stk_callback:
                logger.error("Invalid callback structure - no stkCallback")
                return Response({
                    'ResultCode': 1,
                    'ResultDesc': 'Invalid callback structure'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Extract callback fields
            merchant_request_id = stk_callback.get('MerchantRequestID')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')

            logger.info(f"Processing callback for CheckoutRequestID: {checkout_request_id}")

            # Find transaction by checkout_request_id
            try:
                transaction = Transaction.objects.get(
                    checkout_request_id=checkout_request_id
                )
            except Transaction.DoesNotExist:
                logger.error(f"Transaction not found for CheckoutRequestID: {checkout_request_id}")
                return Response({
                    'ResultCode': 1,
                    'ResultDesc': 'Transaction not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Process based on result code
            if result_code == 0:
                # Success - extract metadata
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])

                # Extract metadata fields
                metadata = {}
                for item in items:
                    name = item.get('Name')
                    value = item.get('Value')
                    metadata[name] = value

                mpesa_receipt_number = metadata.get('MpesaReceiptNumber')
                amount = metadata.get('Amount')
                transaction_date = metadata.get('TransactionDate')
                phone_number = metadata.get('PhoneNumber')

                # Only mark as completed if not already completed
                if not transaction.is_successful:
                    # Mark transaction as completed
                    transaction.mark_as_completed(
                        receipt_number=mpesa_receipt_number,
                        result_code=str(result_code),
                        result_description=result_desc
                    )

                    # Update metadata
                    transaction.metadata.update({
                        'callback_metadata': metadata,
                        'transaction_date': transaction_date
                    })
                    transaction.save()

                logger.info(f"Payment successful for transaction: {transaction.transaction_reference}")

                # Trigger booking confirmation (async task) - always trigger to ensure booking is confirmed
                from .tasks import process_successful_payment
                process_successful_payment.delay(str(transaction.id))

            else:
                # Failed or cancelled - only update if not already failed
                if transaction.status not in [Transaction.FAILED, Transaction.COMPLETED]:
                    transaction.mark_as_failed(
                        result_code=str(result_code),
                        result_description=result_desc
                    )

                    logger.info(f"Payment failed for transaction: {transaction.transaction_reference}")

            # Send acknowledgment to M-Pesa
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Accepted'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing M-Pesa callback: {str(e)}", exc_info=True)
            return Response({
                'ResultCode': 1,
                'ResultDesc': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckPaymentStatusAPIView(generics.RetrieveAPIView):
    """
    Check payment status by transaction reference

    GET /api/payments/status/<transaction_reference>/
    """

    serializer_class = TransactionStatusSerializer
    permission_classes = [AllowAny]
    lookup_field = 'transaction_reference'

    def get_queryset(self):
        return Transaction.objects.all()

    def retrieve(self, request, *args, **kwargs):
        """Get transaction status"""
        transaction = self.get_object()

        # If transaction is still pending and has checkout_request_id, query M-Pesa
        if transaction.is_pending and transaction.checkout_request_id:
            # Query M-Pesa for latest status
            mpesa_response = mpesa_service.query_transaction_status(
                transaction.checkout_request_id
            )

            if mpesa_response.get('success'):
                result_code = mpesa_response.get('result_code')

                # Update transaction based on M-Pesa result code
                if result_code == '0':
                    transaction.mark_as_completed(
                        result_code=result_code,
                        result_description=mpesa_response.get('result_desc')
                    )
                elif result_code in (None, '4999'):
                    # 4999 = still processing, keep as pending
                    pass
                elif result_code and result_code != '0':
                    transaction.mark_as_failed(
                        result_code=result_code,
                        result_description=mpesa_response.get('result_desc')
                    )

        serializer = self.get_serializer(transaction)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing transactions (read-only)

    list: GET /api/payments/transactions/ - List all transactions
    retrieve: GET /api/payments/transactions/<id>/ - Get transaction details
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get transactions for authenticated user"""
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Transaction.objects.none()

        user = self.request.user

        if user.is_staff or user.is_superuser:
            # Admin sees all transactions
            return Transaction.objects.all().select_related('event', 'booking')
        elif hasattr(user, 'role') and user.role == 'ORGANIZER':
            # Organizer sees transactions for their events
            return Transaction.objects.filter(
                event__organizer=user
            ).select_related('event', 'booking')
        else:
            # Attendees see their own transactions (wallet top-ups and bookings)
            # Include transactions where:
            # 1. attendee field is set to current user (wallet top-ups)
            # 2. booking's attendee is the current user (event bookings)
            from django.db.models import Q
            return Transaction.objects.filter(
                Q(attendee=user) | Q(booking__attendee=user)
            ).select_related('event', 'booking').order_by('-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return TransactionListSerializer
        return TransactionDetailSerializer


class CreateStripePaymentIntentAPIView(generics.GenericAPIView):
    """
    Create Stripe Payment Intent

    POST /api/payments/stripe/create-intent/

    Request body:
    {
        "event_id": "uuid",
        "amount": 1000.00,
        "account_reference": "BK-ABC123"
    }
    """

    serializer_class = CreateStripePaymentIntentSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """Create Stripe Payment Intent"""
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract validated data
        event_id = serializer.validated_data['event_id']
        amount = serializer.validated_data['amount']
        account_reference = serializer.validated_data['account_reference']

        # Get event
        event = get_object_or_404(Event, id=event_id)

        # Generate unique transaction reference
        transaction_reference = f"TH{uuid.uuid4().hex[:8].upper()}"

        # Try to find booking by account_reference
        booking = None
        try:
            booking = Booking.objects.get(booking_reference=account_reference)
            logger.info(f"Found booking {account_reference} to link to transaction")

            # Check if booking already has a successful transaction
            existing_successful_transaction = Transaction.objects.filter(
                booking=booking,
                status=Transaction.COMPLETED
            ).first()

            if existing_successful_transaction:
                logger.warning(f"Booking {account_reference} already has a successful transaction: {existing_successful_transaction.transaction_reference}")
                return Response({
                    'success': False,
                    'error': 'This booking has already been paid',
                    'transaction_reference': existing_successful_transaction.transaction_reference
                }, status=status.HTTP_400_BAD_REQUEST)

        except Booking.DoesNotExist:
            logger.info(f"No booking found with reference {account_reference}")

        # Create pending transaction
        transaction = Transaction.objects.create(
            event=event,
            amount=amount,
            phone_number='',  # Not required for card payments
            payment_method=Transaction.CARD,
            transaction_reference=transaction_reference,
            status=Transaction.PENDING,
            booking=booking,
            metadata={
                'account_reference': account_reference,
                'initiated_by': request.user.email if request.user.is_authenticated else 'anonymous'
            }
        )

        logger.info(f"Created pending transaction: {transaction_reference}")

        # Create Stripe Payment Intent
        from .stripe_service import stripe_service
        stripe_response = stripe_service.create_payment_intent(
            amount=amount,
            account_reference=account_reference,
            metadata={
                'transaction_reference': transaction_reference,
                'event_id': str(event_id),
                'event_title': event.title
            }
        )

        if stripe_response.get('success'):
            # Update transaction with Stripe details
            transaction.stripe_payment_intent_id = stripe_response.get('payment_intent_id')
            transaction.save()

            logger.info(f"Payment Intent created for transaction: {transaction_reference}")

            return Response({
                'success': True,
                'transaction_reference': transaction_reference,
                'client_secret': stripe_response.get('client_secret'),
                'payment_intent_id': stripe_response.get('payment_intent_id'),
                'publishable_key': stripe_service.publishable_key
            }, status=status.HTTP_200_OK)
        else:
            # Mark transaction as failed
            transaction.mark_as_failed(
                result_description=stripe_response.get('error', 'Payment Intent creation failed')
            )

            logger.error(f"Payment Intent failed for transaction: {transaction_reference}")

            return Response({
                'success': False,
                'error': stripe_response.get('error', 'Payment initiation failed'),
                'transaction_reference': transaction_reference
            }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookAPIView(generics.GenericAPIView):
    """
    Stripe webhook endpoint
    Receives payment events from Stripe

    POST /api/payments/stripe/webhook/
    """

    permission_classes = [AllowAny]

    def get_serializer_class(self):
        """Return None for schema generation"""
        if getattr(self, 'swagger_fake_view', False):
            return None
        return super().get_serializer_class()

    def post(self, request):
        """Process Stripe webhook"""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        if not sig_header:
            logger.error("No Stripe signature in request")
            return Response({'error': 'No signature'}, status=status.HTTP_400_BAD_REQUEST)

        from .stripe_service import stripe_service
        event = stripe_service.construct_webhook_event(payload, sig_header)

        if not event:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Received Stripe webhook: {event['type']}")

        # Handle payment_intent.succeeded event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']

            logger.info(f"Payment succeeded for Payment Intent: {payment_intent_id}")

            # Find transaction by payment_intent_id
            try:
                transaction = Transaction.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )
            except Transaction.DoesNotExist:
                logger.error(f"Transaction not found for Payment Intent: {payment_intent_id}")
                return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

            # Only mark as completed if not already completed
            if not transaction.is_successful:
                transaction.mark_as_completed(
                    result_code='0',
                    result_description='Payment successful'
                )

                # Update metadata
                transaction.metadata.update({
                    'stripe_charge_id': payment_intent.get('latest_charge'),
                    'payment_method_details': payment_intent.get('charges', {}).get('data', [{}])[0].get('payment_method_details')
                })
                transaction.save()

                logger.info(f"Payment successful for transaction: {transaction.transaction_reference}")

                # Trigger booking confirmation (async task)
                from .tasks import process_successful_payment
                process_successful_payment.delay(str(transaction.id))

        # Handle payment_intent.payment_failed event
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']

            logger.info(f"Payment failed for Payment Intent: {payment_intent_id}")

            # Find transaction
            try:
                transaction = Transaction.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )
            except Transaction.DoesNotExist:
                logger.error(f"Transaction not found for Payment Intent: {payment_intent_id}")
                return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

            # Mark as failed
            if transaction.status not in [Transaction.FAILED, Transaction.COMPLETED]:
                error_message = payment_intent.get('last_payment_error', {}).get('message', 'Payment failed')
                transaction.mark_as_failed(
                    result_code='1',
                    result_description=error_message
                )

                logger.info(f"Payment failed for transaction: {transaction.transaction_reference}")

        return Response({'status': 'success'}, status=status.HTTP_200_OK)

"""
Views for users app - Authentication and user management
"""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenBlacklistView
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UnifiedLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    OrganizerDashboardSerializer,
    LogoutSerializer,
    WalletCardTopUpSerializer,
    WalletTransactionSerializer,
    AddToWalletSerializer
)
from .models import PasswordReset, EmailVerification
from .services import EmailService, generate_verification_token, verify_token
from .tokens import get_tokens_for_user, get_tokens_for_attendee
import secrets
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Register a new organizer
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        tokens = get_tokens_for_user(user)

        # Generate and send verification email
        verification_token = generate_verification_token(user)
        EmailService.send_verification_email(user, verification_token)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': tokens['refresh'],
            'access': tokens['access'],
            'message': 'Registration successful. Please check your email for verification.'
        }, status=status.HTTP_201_CREATED)


class UserLoginView(generics.GenericAPIView):
    """
    POST /api/auth/login/
    Login with email and password
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Generate JWT tokens
        tokens = get_tokens_for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': tokens['refresh'],
            'access': tokens['access'],
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/auth/me/
    Get and update current user profile
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(generics.GenericAPIView):
    """
    POST /api/auth/forgot-password/
    Request password reset (supports both organizers and attendees)
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        # Generate reset token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)

        # Try to find user in User model (organizers/admins)
        try:
            user = User.objects.get(email=email)
            password_reset = PasswordReset.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
            # Send password reset email
            EmailService.send_password_reset_email(user, password_reset, user_type='organizer')

        except User.DoesNotExist:
            # Try to find in Attendee model
            try:
                attendee = Attendee.objects.get(email=email)
                password_reset = PasswordReset.objects.create(
                    attendee=attendee,
                    token=token,
                    expires_at=expires_at
                )
                # Send password reset email
                EmailService.send_password_reset_email(attendee, password_reset, user_type='attendee')

            except Attendee.DoesNotExist:
                # Don't reveal if email exists
                pass

        return Response({
            'message': 'If your email exists in our system, you will receive password reset instructions.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    POST /api/auth/reset-password/
    Confirm password reset with token
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Password has been reset successfully.'
        }, status=status.HTTP_200_OK)


class EmailVerificationView(generics.GenericAPIView):
    """
    POST /api/auth/verify-email/
    Verify email address
    """
    serializer_class = EmailVerificationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        success, message, user_instance = verify_token(token)

        if not success:
            return Response({
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send welcome email
        EmailService.send_welcome_email(user_instance)

        # Determine which serializer to use based on user type
        from .models import Attendee
        if isinstance(user_instance, Attendee):
            user_data = AttendeeSerializer(user_instance).data
        else:
            user_data = UserSerializer(user_instance).data

        return Response({
            'message': message,
            'user': user_data
        }, status=status.HTTP_200_OK)


class ProfileImageUploadView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/auth/upload-logo/
    Upload profile logo/image
    """
    serializer_class = ProfileImageUploadSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'Profile image uploaded successfully.',
            'user': UserSerializer(instance).data
        }, status=status.HTTP_200_OK)


class DocumentUploadView(generics.GenericAPIView):
    """
    POST /api/auth/upload-document/
    Upload verification documents
    """
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = serializer.validated_data['document']
        document_type = serializer.validated_data['document_type']

        user = request.user

        # Save document to storage (local in dev, S3 in prod)
        from django.core.files.storage import default_storage
        file_path = f'documents/{user.id}/{document_type}_{document.name}'
        saved_path = default_storage.save(file_path, document)

        # Add document info to user's verification_documents
        document_info = {
            'type': document_type,
            'filename': document.name,
            'path': saved_path,
            'uploaded_at': timezone.now().isoformat()
        }

        user.verification_documents.append(document_info)
        user.save()

        return Response({
            'message': 'Document uploaded successfully.',
            'document': document_info,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class OrganizerDashboardView(generics.GenericAPIView):
    """
    GET /api/organizer/dashboard/
    Get organizer dashboard statistics
    """
    serializer_class = OrganizerDashboardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = []  # Disable filters for this view

    def get(self, request, *args, **kwargs):
        user = request.user

        # Basic dashboard stats (will be expanded in later sprints)
        dashboard_data = {
            'user': UserSerializer(user).data,
            'stats': {
                'total_events': 0,  # Will be implemented in Sprint 5
                'active_events': 0,
                'total_tickets_sold': 0,
                'total_revenue': 0,
            },
            'verification_status': user.verification_status,
            'email_verified': user.email_verified,
            'profile_complete': bool(user.company_name and user.phone_number and user.logo),
        }

        return Response(dashboard_data, status=status.HTTP_200_OK)


class UserLogoutView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    Logout by blacklisting the refresh token
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                'message': 'Successfully logged out.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token or token already blacklisted.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UnifiedLoginView(generics.GenericAPIView):
    """
    POST /api/auth/unified-login/
    Unified login endpoint that handles both organizers and attendees
    Automatically detects user type and returns appropriate data
    """
    serializer_class = UnifiedLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        authenticated_user = serializer.validated_data['authenticated_user']
        user_type = serializer.validated_data['user_type']

        # Generate appropriate tokens based on user type
        if user_type == 'attendee':
            tokens = get_tokens_for_attendee(authenticated_user)
            from .serializers import AttendeeSerializer
            user_data = AttendeeSerializer(authenticated_user).data
        else:
            tokens = get_tokens_for_user(authenticated_user)
            user_data = UserSerializer(authenticated_user).data

        return Response({
            'user': user_data,
            'user_type': user_type,
            'refresh': tokens['refresh'],
            'access': tokens['access'],
        }, status=status.HTTP_200_OK)


# ATTENDEE-SPECIFIC VIEWS
# These views handle attendee registration, login, and profile management
# They use the Attendee model which is separate from the User (organizer) model
from .models import Attendee
from .serializers import (
    AttendeeRegistrationSerializer,
    AttendeeLoginSerializer,
    AttendeeSerializer,
    AddToWalletSerializer,
    WalletTransactionSerializer
)
from rest_framework.views import APIView
from django.contrib.auth import authenticate


class AttendeeRegistrationView(generics.CreateAPIView):
    """
    POST /api/attendees/register/
    Register a new attendee
    """
    queryset = Attendee.objects.all()
    serializer_class = AttendeeRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendee = serializer.save()

        # Generate JWT tokens for attendee
        tokens = get_tokens_for_attendee(attendee)

        # Generate and send verification email
        verification_token = generate_verification_token(attendee)
        EmailService.send_verification_email(attendee, verification_token)

        return Response({
            'attendee': AttendeeSerializer(attendee).data,
            'refresh': tokens['refresh'],
            'access': tokens['access'],
            'message': 'Registration successful. Please check your email for verification.'
        }, status=status.HTTP_201_CREATED)


class AttendeeLoginView(generics.GenericAPIView):
    """
    POST /api/attendees/login/
    Login attendee with email and password
    """
    serializer_class = AttendeeLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendee = serializer.validated_data['attendee']

        # Generate JWT tokens for attendee
        tokens = get_tokens_for_attendee(attendee)

        return Response({
            'attendee': AttendeeSerializer(attendee).data,
            'refresh': tokens['refresh'],
            'access': tokens['access'],
        }, status=status.HTTP_200_OK)


class AttendeeProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/attendees/profile/
    Get and update current attendee profile
    """
    serializer_class = AttendeeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Note: This requires custom authentication middleware to recognize attendee tokens
        # For now, we'll assume the user is properly authenticated as an attendee
        return self.request.user


class WalletView(generics.GenericAPIView):
    """
    GET/POST /api/attendees/wallet/
    View and manage attendee wallet
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AddToWalletSerializer

    def get(self, request):
        """Get wallet balance and recent transactions"""
        attendee = request.user  # Assuming JWT authentication
        transactions = attendee.wallet_transactions.all().order_by('-created_at')[:10]

        return Response({
            'wallet_balance': attendee.wallet_balance,
            'transactions': WalletTransactionSerializer(transactions, many=True).data
        })

    def post(self, request):
        """
        Initiate M-Pesa payment to add money to wallet

        This will:
        1. Validate the request
        2. Initiate M-Pesa STK Push
        3. Return transaction reference for status checking
        4. M-Pesa callback will add money to wallet when payment succeeds
        """
        from apps.payments.models import Transaction
        from apps.payments.mpesa_service import mpesa_service
        import uuid as uuid_lib
        import logging

        logger = logging.getLogger(__name__)

        attendee = request.user  # Authenticated attendee
        serializer = AddToWalletSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        phone_number = serializer.validated_data.get('phone_number', attendee.phone_number)
        description = serializer.validated_data.get('description', 'Wallet top-up')

        # Validate phone number format (Kenyan: 254XXXXXXXXX)
        if not phone_number.startswith('254') or len(phone_number) != 12:
            return Response({
                'error': 'Invalid phone number format. Use 254XXXXXXXXX'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique transaction reference
        transaction_reference = f"WT{uuid_lib.uuid4().hex[:8].upper()}"

        # Create pending transaction
        transaction = Transaction.objects.create(
            attendee=attendee,
            event=None,  # No event for wallet top-ups
            booking=None,  # No booking for wallet top-ups
            amount=amount,
            phone_number=phone_number,
            payment_method=Transaction.MPESA,
            transaction_reference=transaction_reference,
            status=Transaction.PENDING,
            metadata={
                'description': description,
                'transaction_type': 'WALLET_TOPUP',
                'initiated_by': attendee.email
            }
        )

        logger.info(f"Created pending wallet top-up transaction: {transaction_reference}")

        try:
            # Initiate M-Pesa STK Push
            result = mpesa_service.initiate_stk_push(
                phone_number=phone_number,
                amount=int(amount),
                account_reference=transaction_reference,
                transaction_desc=description
            )

            if result.get('success'):
                # Update transaction with M-Pesa details (note: mpesa_service returns lowercase keys)
                transaction.checkout_request_id = result.get('checkout_request_id')
                transaction.merchant_request_id = result.get('merchant_request_id')
                transaction.save()

                logger.info(f"M-Pesa STK Push initiated for wallet top-up: {transaction_reference}")
                logger.info(f"Transaction updated with CheckoutRequestID: {transaction.checkout_request_id}")

                return Response({
                    'message': 'M-Pesa payment initiated. Please enter your PIN.',
                    'transaction_reference': transaction_reference,
                    'checkout_request_id': result.get('checkout_request_id'),
                    'amount': amount,
                    'phone_number': phone_number
                }, status=status.HTTP_200_OK)
            else:
                # M-Pesa initiation failed
                transaction.status = Transaction.FAILED
                transaction.result_description = result.get('errorMessage', 'Failed to initiate M-Pesa payment')
                transaction.save()

                logger.error(f"M-Pesa initiation failed for wallet top-up: {result.get('errorMessage')}")

                return Response({
                    'error': result.get('errorMessage', 'Failed to initiate M-Pesa payment')
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error initiating wallet top-up: {str(e)}", exc_info=True)

            transaction.status = Transaction.FAILED
            transaction.result_description = str(e)
            transaction.save()

            return Response({
                'error': 'An error occurred while initiating payment. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WalletCardTopUpView(generics.GenericAPIView):
    """
    POST /api/attendees/wallet/card-topup/
    Initiate Stripe card payment to add money to wallet
    """
    permission_classes = [IsAuthenticated]
    serializer_class = WalletCardTopUpSerializer

    def post(self, request):
        """
        Create Stripe Payment Intent for wallet top-up

        This will:
        1. Validate the request
        2. Create Payment Intent with Stripe
        3. Return client_secret for Stripe Elements
        4. Stripe webhook will add money to wallet when payment succeeds
        """
        from apps.payments.models import Transaction
        from apps.payments.stripe_service import stripe_service
        import uuid as uuid_lib
        import logging

        logger = logging.getLogger(__name__)

        attendee = request.user  # Authenticated attendee
        serializer = AddToWalletSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', 'Wallet top-up')

        # Generate unique transaction reference
        transaction_reference = f"WT{uuid_lib.uuid4().hex[:8].upper()}"

        # Create pending transaction
        transaction = Transaction.objects.create(
            attendee=attendee,
            event=None,  # No event for wallet top-ups
            booking=None,  # No booking for wallet top-ups
            amount=amount,
            phone_number='',  # Not required for card payments
            payment_method=Transaction.CARD,
            transaction_reference=transaction_reference,
            status=Transaction.PENDING,
            metadata={
                'description': description,
                'transaction_type': 'WALLET_TOPUP',
                'initiated_by': attendee.email
            }
        )

        logger.info(f"Created pending wallet card top-up transaction: {transaction_reference}")

        try:
            # Create Stripe Payment Intent
            stripe_response = stripe_service.create_payment_intent(
                amount=amount,
                account_reference=transaction_reference,
                metadata={
                    'transaction_reference': transaction_reference,
                    'transaction_type': 'WALLET_TOPUP',
                    'attendee_id': str(attendee.id),
                    'attendee_email': attendee.email
                }
            )

            if stripe_response.get('success'):
                # Update transaction with Stripe details
                transaction.stripe_payment_intent_id = stripe_response.get('payment_intent_id')
                transaction.save()

                logger.info(f"Stripe Payment Intent created for wallet top-up: {transaction_reference}")

                return Response({
                    'success': True,
                    'transaction_reference': transaction_reference,
                    'client_secret': stripe_response.get('client_secret'),
                    'payment_intent_id': stripe_response.get('payment_intent_id'),
                    'publishable_key': stripe_service.publishable_key,
                    'amount': amount
                }, status=status.HTTP_200_OK)
            else:
                # Stripe initiation failed
                transaction.status = Transaction.FAILED
                transaction.result_description = stripe_response.get('error', 'Failed to create Payment Intent')
                transaction.save()

                logger.error(f"Stripe Payment Intent failed for wallet top-up: {stripe_response.get('error')}")

                return Response({
                    'success': False,
                    'error': stripe_response.get('error', 'Failed to initiate card payment')
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error initiating wallet card top-up: {str(e)}", exc_info=True)

            transaction.status = Transaction.FAILED
            transaction.result_description = str(e)
            transaction.save()

            return Response({
                'error': 'An error occurred while initiating payment. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AttendeeLogoutView(generics.GenericAPIView):
    """
    POST /api/attendees/logout/
    Logout attendee by blacklisting the refresh token
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)

            # Blacklist the token - handle OutstandingToken issues gracefully
            try:
                token.blacklist()
            except Exception:
                # If blacklisting fails due to OutstandingToken issues with custom user model,
                # log the error but still return success
                import logging
                logging.error("Token blacklisting failed for attendee token")
                pass

            return Response({
                'message': 'Successfully logged out.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token or token already blacklisted.'
            }, status=status.HTTP_400_BAD_REQUEST)


class AttendeeTicketsView(generics.GenericAPIView):
    """
    GET /api/attendees/tickets/
    Get all tickets for the logged-in attendee
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from apps.bookings.models import Ticket
        from apps.bookings.serializers import TicketSerializer
        from apps.users.models import Attendee

        try:
            user = request.user

            # Check if user is an Attendee instance
            if not isinstance(user, Attendee):
                return Response({
                    'error': 'Only attendees can access tickets.'
                }, status=status.HTTP_403_FORBIDDEN)

            attendee = user

            # Get all tickets for bookings made by this attendee
            # Match by both attendee FK and email (for cases where FK might not be set)
            from django.db.models import Q
            tickets = Ticket.objects.filter(
                Q(booking__attendee=attendee) | Q(booking__attendee_email=attendee.email)
            ).select_related(
                'booking', 'booking__event', 'ticket_type'
            ).order_by('-created_at')

            serializer = TicketSerializer(tickets, many=True)

            return Response({
                'tickets': serializer.data,
                'count': tickets.count()
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching attendee tickets: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while fetching tickets.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

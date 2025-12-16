"""
Views for users app - Authentication and user management
"""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer
)
from .models import PasswordReset, EmailVerification
from .services import EmailService, generate_verification_token, verify_token
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
        refresh = RefreshToken.for_user(user)

        # Generate and send verification email
        verification_token = generate_verification_token(user)
        EmailService.send_verification_email(user, verification_token)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
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
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
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
    Request password reset
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)

            # Generate reset token
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=24)

            password_reset = PasswordReset.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )

            # Send password reset email
            EmailService.send_password_reset_email(user, password_reset)

        except User.DoesNotExist:
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
        success, message, user = verify_token(token)

        if not success:
            return Response({
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send welcome email
        EmailService.send_welcome_email(user)

        return Response({
            'message': message,
            'user': UserSerializer(user).data
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
    permission_classes = [IsAuthenticated]

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

"""
Serializers for users app
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import MinValueValidator
from .models import User, Attendee, PasswordReset, WalletTransaction


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User profile (organizers/admins)"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'company_name', 'phone_number', 'logo',
            'role', 'verification_status', 'email_verified', 'verification_documents',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'verification_status', 'email_verified', 'created_at', 'updated_at']


class AttendeeSerializer(serializers.ModelSerializer):
    """Serializer for Attendee profile (system users)"""

    class Meta:
        model = Attendee
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'role', 'wallet_balance', 'email_verified', 'phone_verified',
            'is_active', 'is_subscribed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'wallet_balance', 'email_verified', 'phone_verified', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for organizer registration"""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'company_name', 'phone_number']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            company_name=validated_data.get('company_name', ''),
            phone_number=validated_data['phone_number'],
            role=User.ORGANIZER
        )
        return user


class AttendeeRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for attendee registration"""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

    class Meta:
        model = Attendee
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'password', 'password2', 'is_subscribed']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        attendee = Attendee.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            is_subscribed=validated_data.get('is_subscribed', False)
        )
        return attendee


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login (organizers/admins)"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )

            if not user:
                raise serializers.ValidationError('Unable to log in with provided credentials.')

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')

            if not user.email_verified:
                raise serializers.ValidationError(
                    'Please verify your email address before logging in. Check your inbox for the verification email.'
                )

        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        attrs['user'] = user
        return attrs


class AttendeeLoginSerializer(serializers.Serializer):
    """Serializer for attendee login"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Custom authentication for Attendee
            try:
                attendee = Attendee.objects.get(email=email)
                if not attendee.check_password(password):
                    raise serializers.ValidationError('Unable to log in with provided credentials.')

                if not attendee.is_active:
                    raise serializers.ValidationError('Attendee account is disabled.')

                if not attendee.email_verified:
                    raise serializers.ValidationError(
                        'Please verify your email address before logging in. Check your inbox for the verification email.'
                    )
            except Attendee.DoesNotExist:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        attrs['attendee'] = attendee
        return attrs


class UnifiedLoginSerializer(serializers.Serializer):
    """
    Unified login serializer that handles both User and Attendee models
    Automatically detects the user type based on the email
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Must include "email" and "password".')

        # Try to authenticate as User (organizer/admin) first
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if user:
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['authenticated_user'] = user
            attrs['user_type'] = 'organizer'
            return attrs

        # If not found as User, try Attendee
        try:
            attendee = Attendee.objects.get(email=email)
            if not attendee.check_password(password):
                raise serializers.ValidationError('Unable to log in with provided credentials.')

            if not attendee.is_active:
                raise serializers.ValidationError('Account is disabled.')

            attrs['authenticated_user'] = attendee
            attrs['user_type'] = 'attendee'
            return attrs

        except Attendee.DoesNotExist:
            raise serializers.ValidationError('Unable to log in with provided credentials.')

        raise serializers.ValidationError('Unable to log in with provided credentials.')


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Check both User and Attendee models
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            try:
                Attendee.objects.get(email=value)
            except Attendee.DoesNotExist:
                # Don't reveal if email exists or not
                pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset"""

    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Validate token
        try:
            reset = PasswordReset.objects.get(token=attrs['token'])
            if not reset.is_valid:
                raise serializers.ValidationError({"token": "Invalid or expired token."})
            attrs['reset'] = reset
        except PasswordReset.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        return attrs

    def save(self):
        reset = self.validated_data['reset']

        # Handle both User and Attendee models
        if reset.user:
            user_obj = reset.user
        elif reset.attendee:
            user_obj = reset.attendee
        else:
            raise serializers.ValidationError({"token": "Invalid reset token."})

        user_obj.set_password(self.validated_data['password'])
        user_obj.save()

        # Mark token as used
        reset.used = True
        reset.save()

        return user_obj


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""

    token = serializers.CharField(required=True)


class ProfileImageUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading profile image/logo"""

    class Meta:
        model = User
        fields = ['logo']


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for uploading verification documents"""

    document = serializers.FileField(required=True)
    document_type = serializers.ChoiceField(
        choices=[
            ('business_registration', 'Business Registration'),
            ('id_document', 'ID Document'),
            ('tax_certificate', 'Tax Certificate'),
            ('other', 'Other'),
        ],
        required=True
    )

    def validate_document(self, value):
        """Validate uploaded document"""
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must not exceed 5MB.")

        # Check file extension
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file extension. Allowed: {', '.join(allowed_extensions)}"
            )

        return value


class WalletTransactionSerializer(serializers.ModelSerializer):
    """Serializer for wallet transactions"""

    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'attendee', 'transaction_type', 'amount', 'description',
            'balance_after', 'booking', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'balance_after']


class AddToWalletSerializer(serializers.Serializer):
    """Serializer for adding money to wallet via M-Pesa"""

    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    phone_number = serializers.CharField(
        max_length=15,
        required=False,
        help_text="Phone number for M-Pesa payment (254XXXXXXXXX). If not provided, uses attendee's phone number."
    )
    description = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default='Wallet top-up'
    )


class WalletTransferSerializer(serializers.Serializer):
    """Serializer for wallet transfers between attendees"""

    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    recipient_email = serializers.EmailField()


# Admin Serializers

class AdminOrganizerListSerializer(serializers.ModelSerializer):
    """Serializer for admin view of organizers list"""

    documents_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'company_name', 'phone_number', 'logo',
            'role', 'verification_status', 'email_verified',
            'is_active', 'created_at', 'updated_at', 'documents_count'
        ]
        read_only_fields = fields

    def get_documents_count(self, obj):
        """Get count of uploaded verification documents"""
        return len(obj.verification_documents) if obj.verification_documents else 0


class AdminOrganizerDetailSerializer(serializers.ModelSerializer):
    """Serializer for admin view of organizer details"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'company_name', 'phone_number', 'logo',
            'role', 'verification_status', 'email_verified', 'verification_documents',
            'is_active', 'is_staff', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = fields


class AdminAttendeeListSerializer(serializers.ModelSerializer):
    """Serializer for admin view of attendees list"""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Attendee
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'role',
            'wallet_balance', 'email_verified', 'phone_verified',
            'is_active', 'is_subscribed', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


class AdminAttendeeDetailSerializer(serializers.ModelSerializer):
    """Serializer for admin view of attendee details"""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Attendee
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'role',
            'wallet_balance', 'email_verified', 'phone_verified',
            'is_active', 'is_subscribed', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


class OrganizerApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting organizer applications"""

    action = serializers.ChoiceField(
        choices=['approve', 'reject'],
        required=True
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Optional reason for rejection"
    )

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('reason'):
            raise serializers.ValidationError({
                "reason": "Reason is required when rejecting an organizer."
            })
        return attrs


class AdminUpdateOrganizerSerializer(serializers.ModelSerializer):
    """Serializer for admin to update organizer details"""

    class Meta:
        model = User
        fields = [
            'company_name', 'phone_number', 'is_active',
            'verification_status', 'role'
        ]

    def validate_verification_status(self, value):
        """Validate verification status transitions"""
        valid_statuses = [User.PENDING, User.APPROVED, User.REJECTED]
        if value not in valid_statuses:
            raise serializers.ValidationError("Invalid verification status.")
        return value


class AdminUpdateAttendeeSerializer(serializers.ModelSerializer):
    """Serializer for admin to update attendee details"""

    class Meta:
        model = Attendee
        fields = [
            'first_name', 'last_name', 'phone_number', 'role',
            'is_active', 'is_subscribed'
        ]


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard response (for schema generation only)"""

    organizer_stats = serializers.DictField(help_text="Organizer statistics")
    user_stats = serializers.DictField(help_text="User statistics")
    platform_stats = serializers.DictField(help_text="Platform statistics")
    recent_pending_organizers = AdminOrganizerListSerializer(many=True)


class AdminAnalyticsSerializer(serializers.Serializer):
    """Serializer for admin analytics response (for schema generation only)"""

    time_period = serializers.CharField(help_text="Time period for analytics")
    organizer_registrations = serializers.ListField(help_text="Organizer registrations over time")
    approval_rate = serializers.FloatField(help_text="Approval rate percentage")
    email_verification_rate = serializers.FloatField(help_text="Email verification rate percentage")
    metrics = serializers.DictField(help_text="Additional metrics")


class OrganizerDashboardSerializer(serializers.Serializer):
    """Serializer for organizer dashboard response (for schema generation only)"""

    user = UserSerializer(help_text="User profile information")
    stats = serializers.DictField(help_text="Dashboard statistics")
    verification_status = serializers.CharField(help_text="Organizer verification status")
    email_verified = serializers.BooleanField(help_text="Email verification status")
    profile_complete = serializers.BooleanField(help_text="Profile completion status")

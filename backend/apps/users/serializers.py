"""
Serializers for users app
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, PasswordReset


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User profile"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'company_name', 'phone_number', 'logo',
            'role', 'verification_status', 'email_verified', 'verification_documents',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'verification_status', 'email_verified', 'created_at', 'updated_at']


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


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""

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

        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
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
        user = reset.user
        user.set_password(self.validated_data['password'])
        user.save()

        # Mark token as used
        reset.used = True
        reset.save()

        return user


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

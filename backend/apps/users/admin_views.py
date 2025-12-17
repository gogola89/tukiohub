"""
Admin-specific views for user management
"""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from .serializers import (
    AdminOrganizerListSerializer,
    AdminOrganizerDetailSerializer,
    OrganizerApprovalSerializer,
    AdminUpdateOrganizerSerializer,
    AdminDashboardSerializer,
    AdminAnalyticsSerializer
)
from .permissions import IsAdmin
from .services import EmailService
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class AdminOrganizerListView(generics.ListAPIView):
    """
    GET /api/admin/organizers/
    List all organizers (admin only)
    """
    serializer_class = AdminOrganizerListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """
        Get organizers list with optional filtering
        """
        queryset = User.objects.filter(role=User.ORGANIZER).order_by('-created_at')

        # Filter by verification status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(verification_status=status.upper())

        # Filter by email verified
        email_verified = self.request.query_params.get('email_verified', None)
        if email_verified is not None:
            verified = email_verified.lower() == 'true'
            queryset = queryset.filter(email_verified=verified)

        # Search by email or company name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(company_name__icontains=search)
            )

        return queryset


class AdminOrganizerDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/admin/organizers/<id>/
    Get or update organizer details (admin only)
    """
    queryset = User.objects.filter(role=User.ORGANIZER)
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return AdminUpdateOrganizerSerializer
        return AdminOrganizerDetailSerializer


class OrganizerApprovalView(generics.GenericAPIView):
    """
    POST /api/admin/organizers/<id>/approve-reject/
    Approve or reject organizer application (admin only)
    """
    serializer_class = OrganizerApprovalSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.filter(role=User.ORGANIZER)

    def post(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk, role=User.ORGANIZER)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', None)

        if action == 'approve':
            user.verification_status = User.APPROVED
            user.save()

            # Send approval email
            EmailService.send_approval_email(user)

            logger.info(f"Organizer {user.email} approved by admin {request.user.email}")

            return Response({
                'message': 'Organizer approved successfully.',
                'user': AdminOrganizerDetailSerializer(user).data
            }, status=status.HTTP_200_OK)

        elif action == 'reject':
            user.verification_status = User.REJECTED
            user.save()

            # Send rejection email with reason
            EmailService.send_rejection_email(user, reason)

            logger.info(f"Organizer {user.email} rejected by admin {request.user.email}. Reason: {reason}")

            return Response({
                'message': 'Organizer rejected.',
                'user': AdminOrganizerDetailSerializer(user).data
            }, status=status.HTTP_200_OK)


class AdminDashboardView(generics.GenericAPIView):
    """
    GET /api/admin/dashboard/
    Get admin dashboard statistics
    """
    serializer_class = AdminDashboardSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = []  # Disable filters for this view

    def get(self, request):
        # Get organizer statistics
        total_organizers = User.objects.filter(role=User.ORGANIZER).count()
        pending_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.PENDING
        ).count()
        approved_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.APPROVED
        ).count()
        rejected_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.REJECTED
        ).count()

        # Get user statistics
        total_users = User.objects.count()
        verified_emails = User.objects.filter(email_verified=True).count()
        active_users = User.objects.filter(is_active=True).count()

        # Recent organizer applications (last 7 days)
        from datetime import timedelta
        from django.utils import timezone
        week_ago = timezone.now() - timedelta(days=7)
        recent_applications = User.objects.filter(
            role=User.ORGANIZER,
            created_at__gte=week_ago
        ).count()

        dashboard_data = {
            'organizer_stats': {
                'total': total_organizers,
                'pending': pending_organizers,
                'approved': approved_organizers,
                'rejected': rejected_organizers,
                'recent_applications': recent_applications
            },
            'user_stats': {
                'total_users': total_users,
                'verified_emails': verified_emails,
                'active_users': active_users
            },
            'platform_stats': {
                'total_events': 0,  # Will be implemented in Sprint 5
                'total_bookings': 0,  # Will be implemented in later sprints
                'total_revenue': 0  # Will be implemented in later sprints
            }
        }

        # Get recent pending organizers
        recent_pending = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.PENDING
        ).order_by('-created_at')[:5]

        dashboard_data['recent_pending_organizers'] = AdminOrganizerListSerializer(
            recent_pending, many=True
        ).data

        return Response(dashboard_data, status=status.HTTP_200_OK)


class AdminAnalyticsView(generics.GenericAPIView):
    """
    GET /api/admin/analytics/
    Get admin analytics and reports
    """
    serializer_class = AdminAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = []  # Disable filters for this view

    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from django.db.models.functions import TruncDate
        from django.db.models import Count

        # Get date range (default last 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)

        # Organizer registrations over time
        organizer_registrations = User.objects.filter(
            role=User.ORGANIZER,
            created_at__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        # Approval rate
        total_processed = User.objects.filter(
            role=User.ORGANIZER,
            verification_status__in=[User.APPROVED, User.REJECTED]
        ).count()

        approved_count = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.APPROVED
        ).count()

        approval_rate = (approved_count / total_processed * 100) if total_processed > 0 else 0

        # Email verification rate
        total_organizers = User.objects.filter(role=User.ORGANIZER).count()
        verified_emails_count = User.objects.filter(
            role=User.ORGANIZER,
            email_verified=True
        ).count()

        email_verification_rate = (verified_emails_count / total_organizers * 100) if total_organizers > 0 else 0

        analytics_data = {
            'time_period': f'Last {days} days',
            'organizer_registrations': list(organizer_registrations),
            'approval_rate': round(approval_rate, 2),
            'email_verification_rate': round(email_verification_rate, 2),
            'metrics': {
                'total_processed': total_processed,
                'approved_count': approved_count,
                'rejected_count': total_processed - approved_count
            }
        }

        return Response(analytics_data, status=status.HTTP_200_OK)

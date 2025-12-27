"""
Custom permissions for events app
"""

from rest_framework import permissions


class IsEventOrganizer(permissions.BasePermission):
    """
    Permission to check if user is the organizer of the event
    """

    def has_object_permission(self, request, view, obj):
        """Check if user is the organizer of the event"""
        # Get the event object
        if hasattr(obj, 'organizer'):
            event = obj
        elif hasattr(obj, 'event'):
            event = obj.event
        else:
            return False

        return event.organizer == request.user


class IsVerifiedOrganizer(permissions.BasePermission):
    """
    Permission to check if user is a verified organizer
    For viewing (list, retrieve): Allow all organizers regardless of verification status
    For modifying (create, update, delete, publish): Require APPROVED status
    """

    def has_permission(self, request, view):
        """Check if user is a verified organizer"""
        from apps.users.models import User

        if not request.user or not request.user.is_authenticated:
            return False

        # Must be an organizer
        if request.user.role != User.ORGANIZER:
            return False

        # For read-only actions (list, retrieve), allow all organizers
        if view.action in ['list', 'retrieve']:
            return True

        # For write actions, require verification
        return request.user.verification_status == User.APPROVED


class CanManageEvent(permissions.BasePermission):
    """
    Permission to check if user can manage the event
    (either event organizer or admin)
    """

    def has_object_permission(self, request, view, obj):
        """Check if user can manage the event"""
        from apps.users.models import User

        # Admins can manage all events
        if request.user.role == User.ADMIN:
            return True

        # Get the event object
        if hasattr(obj, 'organizer'):
            event = obj
        elif hasattr(obj, 'event'):
            event = obj.event
        else:
            return False

        # Event organizer can manage their own events
        return event.organizer == request.user

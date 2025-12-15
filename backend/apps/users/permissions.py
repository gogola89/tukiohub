"""
Custom permissions for users app
"""

from rest_framework import permissions


class IsOrganizer(permissions.BasePermission):
    """
    Permission to check if user is an organizer
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_organizer


class IsAdmin(permissions.BasePermission):
    """
    Permission to check if user is an admin
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin_user


class IsVerifiedOrganizer(permissions.BasePermission):
    """
    Permission to check if user is a verified organizer
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_organizer
            and request.user.is_verified
        )

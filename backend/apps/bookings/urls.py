"""
URL routing for bookings app
"""

from django.urls import path
from .views import (
    CreateBookingAPIView,
    GetBookingAPIView,
    ConfirmWalletPaymentAPIView,
    CancelBookingAPIView,
    VerifyTicketAPIView,
    CheckInTicketAPIView,
    TransferTicketAPIView,
    DownloadTicketAPIView,
)

app_name = 'bookings'

urlpatterns = [
    # Booking endpoints
    path('create/', CreateBookingAPIView.as_view(), name='create-booking'),
    path('<str:booking_reference>/', GetBookingAPIView.as_view(), name='get-booking'),
    path('<str:booking_reference>/confirm-wallet-payment/', ConfirmWalletPaymentAPIView.as_view(), name='confirm-wallet-payment'),
    path('<str:booking_reference>/cancel/', CancelBookingAPIView.as_view(), name='cancel-booking'),

    # Ticket endpoints
    path('tickets/verify/', VerifyTicketAPIView.as_view(), name='verify-ticket'),
    path('tickets/<str:ticket_code>/checkin/', CheckInTicketAPIView.as_view(), name='checkin-ticket'),
    path('tickets/<str:ticket_code>/transfer/', TransferTicketAPIView.as_view(), name='transfer-ticket'),
    path('tickets/<str:ticket_code>/download/', DownloadTicketAPIView.as_view(), name='download-ticket'),
]

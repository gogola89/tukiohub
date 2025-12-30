"""
URL routing for payments app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InitiateMpesaPaymentAPIView,
    MpesaCallbackAPIView,
    CheckPaymentStatusAPIView,
    TransactionViewSet,
    CreateStripePaymentIntentAPIView,
    StripeWebhookAPIView
)

app_name = 'payments'

# Create router for viewsets
router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    # M-Pesa endpoints
    path('mpesa/initiate/', InitiateMpesaPaymentAPIView.as_view(), name='mpesa-initiate'),
    path('mpesa/callback/', MpesaCallbackAPIView.as_view(), name='mpesa-callback'),

    # Stripe endpoints
    path('stripe/create-intent/', CreateStripePaymentIntentAPIView.as_view(), name='stripe-create-intent'),
    path('stripe/webhook/', StripeWebhookAPIView.as_view(), name='stripe-webhook'),

    # Payment status
    path('status/<str:transaction_reference>/', CheckPaymentStatusAPIView.as_view(), name='payment-status'),

    # Include router URLs
    path('', include(router.urls)),
]

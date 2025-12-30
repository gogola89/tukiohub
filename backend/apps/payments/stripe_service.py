"""
Stripe Payment Integration Service
"""

import stripe
from django.conf import settings
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class StripeService:
    """
    Service class for Stripe payment integration
    Handles Payment Intents, webhooks, and payment confirmation
    """

    def __init__(self):
        """Initialize Stripe with API credentials"""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.publishable_key = settings.STRIPE_PUBLISHABLE_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    def create_payment_intent(self, amount, account_reference, metadata=None):
        """
        Create Stripe Payment Intent

        Args:
            amount (Decimal): Amount in KES
            account_reference (str): Booking reference
            metadata (dict): Additional metadata

        Returns:
            dict: Payment intent details or error dict
        """
        try:
            # Convert amount to cents (Stripe requires smallest currency unit)
            amount_cents = int(amount * 100)

            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=settings.STRIPE_CURRENCY,
                metadata={
                    'account_reference': account_reference,
                    **(metadata or {})
                },
                automatic_payment_methods={
                    'enabled': True,
                },
            )

            logger.info(f"Created Payment Intent: {intent.id}")

            return {
                'success': True,
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': amount,
                'status': intent.status
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Error creating payment intent: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }

    def retrieve_payment_intent(self, payment_intent_id):
        """
        Retrieve payment intent status

        Args:
            payment_intent_id (str): Stripe Payment Intent ID

        Returns:
            dict: Payment intent details or error dict
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return {
                'success': True,
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount': Decimal(intent.amount) / 100,
                'metadata': intent.metadata
            }

        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving payment intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def confirm_payment_intent(self, payment_intent_id):
        """
        Confirm payment intent (used for server-side confirmation if needed)

        Args:
            payment_intent_id (str): Stripe Payment Intent ID

        Returns:
            dict: Confirmation result
        """
        try:
            intent = stripe.PaymentIntent.confirm(payment_intent_id)

            return {
                'success': True,
                'payment_intent_id': intent.id,
                'status': intent.status
            }

        except stripe.error.StripeError as e:
            logger.error(f"Error confirming payment intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def construct_webhook_event(self, payload, sig_header):
        """
        Construct webhook event from Stripe signature

        Args:
            payload: Request body
            sig_header: Stripe signature header

        Returns:
            stripe.Event or None
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            return None


# Create singleton instance
stripe_service = StripeService()

"""
M-Pesa Daraja API integration service
"""

import base64
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class MpesaService:
    """
    Service class for M-Pesa Daraja API integration
    Handles OAuth, STK Push, and transaction queries
    """

    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.passkey = settings.MPESA_PASSKEY
        self.shortcode = settings.MPESA_SHORTCODE
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.environment = settings.MPESA_ENVIRONMENT  # 'sandbox' or 'production'

        # Set API base URL based on environment
        if self.environment == 'sandbox':
            self.base_url = 'https://sandbox.safaricom.co.ke'
        else:
            self.base_url = 'https://api.safaricom.co.ke'

        # API endpoints
        self.auth_url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        self.stk_push_url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
        self.query_url = f'{self.base_url}/mpesa/stkpushquery/v1/query'

    def get_access_token(self):
        """
        Generate OAuth access token from Daraja API
        Caches token for 55 minutes (expires in 1 hour)

        Returns:
            str: Access token or None if failed
        """
        # Check if token exists in cache
        cached_token = cache.get('mpesa_access_token')
        if cached_token:
            logger.info("Using cached M-Pesa access token")
            return cached_token

        try:
            # Encode consumer key and secret
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()

            # Make request
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }

            response = requests.get(self.auth_url, headers=headers)
            response.raise_for_status()

            # Extract token
            data = response.json()
            access_token = data.get('access_token')

            if not access_token:
                logger.error("No access token in response")
                return None

            # Cache token for 55 minutes (expires in 60 minutes)
            cache.set('mpesa_access_token', access_token, timeout=55 * 60)

            logger.info("Successfully generated M-Pesa access token")
            return access_token

        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating M-Pesa access token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating access token: {str(e)}")
            return None

    def get_timestamp(self):
        """
        Generate timestamp in the format YYYYMMDDHHmmss

        Returns:
            str: Formatted timestamp
        """
        return datetime.now().strftime('%Y%m%d%H%M%S')

    def generate_password(self, timestamp):
        """
        Generate password for STK Push
        Password = Base64(Shortcode + Passkey + Timestamp)

        Args:
            timestamp (str): Timestamp in YYYYMMDDHHmmss format

        Returns:
            str: Base64 encoded password
        """
        data_to_encode = f"{self.shortcode}{self.passkey}{timestamp}"
        encoded = base64.b64encode(data_to_encode.encode()).decode()
        return encoded

    def format_phone_number(self, phone_number):
        """
        Format phone number to Kenyan format (254XXXXXXXXX)

        Args:
            phone_number (str): Phone number in various formats

        Returns:
            str: Formatted phone number or None if invalid
        """
        # Remove any whitespace and special characters
        phone = ''.join(filter(str.isdigit, str(phone_number)))

        # Handle different formats
        if phone.startswith('254'):
            return phone
        elif phone.startswith('0'):
            return '254' + phone[1:]
        elif phone.startswith('7') or phone.startswith('1'):
            return '254' + phone
        else:
            logger.warning(f"Invalid phone number format: {phone_number}")
            return None

    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push to customer's phone

        Args:
            phone_number (str): Customer's phone number (Kenyan format)
            amount (float): Amount to charge
            account_reference (str): Reference for the transaction
            transaction_desc (str): Description of the transaction

        Returns:
            dict: Response from Daraja API or error dict
        """
        # Get access token
        access_token = self.get_access_token()
        if not access_token:
            return {
                'success': False,
                'error': 'Failed to generate access token'
            }

        # Format phone number
        formatted_phone = self.format_phone_number(phone_number)
        if not formatted_phone:
            return {
                'success': False,
                'error': 'Invalid phone number format'
            }

        # Generate timestamp and password
        timestamp = self.get_timestamp()
        password = self.generate_password(timestamp)

        # Prepare request payload
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),  # M-Pesa expects integer
            'PartyA': formatted_phone,
            'PartyB': self.shortcode,
            'PhoneNumber': formatted_phone,
            'CallBackURL': self.callback_url,
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }

        # Make request
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        try:
            logger.info(f"Initiating STK Push for {formatted_phone}, Amount: {amount}")

            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )

            # Log response
            logger.info(f"M-Pesa STK Push response status: {response.status_code}")
            logger.debug(f"M-Pesa STK Push response: {response.text}")

            response.raise_for_status()
            data = response.json()

            # Check if request was successful
            if data.get('ResponseCode') == '0':
                return {
                    'success': True,
                    'checkout_request_id': data.get('CheckoutRequestID'),
                    'merchant_request_id': data.get('MerchantRequestID'),
                    'response_code': data.get('ResponseCode'),
                    'response_description': data.get('ResponseDescription'),
                    'customer_message': data.get('CustomerMessage')
                }
            else:
                return {
                    'success': False,
                    'error': data.get('ResponseDescription', 'STK Push failed'),
                    'response_code': data.get('ResponseCode'),
                    'error_message': data.get('errorMessage')
                }

        except requests.exceptions.Timeout:
            logger.error("M-Pesa STK Push request timeout")
            return {
                'success': False,
                'error': 'Request timeout. Please try again.'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"M-Pesa STK Push error: {str(e)}")
            return {
                'success': False,
                'error': f'Payment request failed: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Unexpected error in STK Push: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }

    def query_transaction_status(self, checkout_request_id):
        """
        Query the status of an STK Push transaction

        Args:
            checkout_request_id (str): CheckoutRequestID from STK Push response

        Returns:
            dict: Transaction status response
        """
        # Get access token
        access_token = self.get_access_token()
        if not access_token:
            return {
                'success': False,
                'error': 'Failed to generate access token'
            }

        # Generate timestamp and password
        timestamp = self.get_timestamp()
        password = self.generate_password(timestamp)

        # Prepare request payload
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        try:
            logger.info(f"Querying transaction status for: {checkout_request_id}")

            response = requests.post(
                self.query_url,
                json=payload,
                headers=headers,
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            logger.info(f"Transaction query response: {data}")

            return {
                'success': True,
                'result_code': data.get('ResultCode'),
                'result_desc': data.get('ResultDesc'),
                'response_code': data.get('ResponseCode'),
                'response_description': data.get('ResponseDescription')
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying transaction status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error querying transaction: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }


# Create a singleton instance
mpesa_service = MpesaService()

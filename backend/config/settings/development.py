"""
TukioHub Development Settings
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# CORS Settings for development
CORS_ALLOW_ALL_ORIGINS = True

# Email Backend for Development (Console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Frontend URL for email links
FRONTEND_URL = 'http://localhost:3000'

# Django Debug Toolbar
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Additional Development Tools
INSTALLED_APPS += ['django_extensions']

# Logging level for development
LOGGING['root']['level'] = 'DEBUG'
LOGGING['loggers']['apps']['level'] = 'DEBUG'

# Development-specific settings
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

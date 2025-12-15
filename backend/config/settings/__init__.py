"""
Settings package for TukioHub
"""

from decouple import config

ENVIRONMENT = config('ENVIRONMENT', default='development')

if ENVIRONMENT == 'production':
    from .production import *
elif ENVIRONMENT == 'staging':
    from .production import *  # Use production settings for staging
else:
    from .development import *

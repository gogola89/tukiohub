"""
Service functions for events app
"""

import math
from django.utils.text import slugify
from django.core.cache import cache
from django.conf import settings
from .models import Event


def generate_slug(title):
    """
    Generate unique slug from title

    Args:
        title (str): Event title

    Returns:
        str: Unique slug
    """
    base_slug = slugify(title)
    slug = base_slug
    counter = 1

    while Event.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def geocode_address(address):
    """
    Geocode address to get latitude and longitude

    Args:
        address (str): Full address to geocode

    Returns:
        tuple: (latitude, longitude) or (None, None) if geocoding fails

    Note:
        This is a placeholder implementation. In production, integrate with
        Google Maps Geocoding API or similar service.

        Example implementation with Google Maps:
        ```python
        import googlemaps

        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        result = gmaps.geocode(address)

        if result:
            location = result[0]['geometry']['location']
            return location['lat'], location['lng']
        return None, None
        ```
    """
    # Placeholder implementation
    # TODO: Integrate with Google Maps Geocoding API in production

    # For development, return default coordinates (Nairobi, Kenya)
    if not address:
        return None, None

    # Default to Nairobi coordinates for now
    return -1.286389, 36.817223


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula

    Args:
        lat1 (float): Latitude of first point
        lon1 (float): Longitude of first point
        lat2 (float): Latitude of second point
        lon2 (float): Longitude of second point

    Returns:
        float: Distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371

    # Convert degrees to radians
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))

    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    distance = R * c
    return distance


def cache_event_data(event_id, timeout=3600):
    """
    Cache event data in Redis

    Args:
        event_id (UUID): Event ID to cache
        timeout (int): Cache timeout in seconds (default 1 hour)

    Returns:
        dict: Cached event data or None if event doesn't exist
    """
    cache_key = f'event_{event_id}'

    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    # If not in cache, get from database
    try:
        event = Event.objects.select_related('organizer').prefetch_related(
            'ticket_types',
            'promo_codes',
            'addons',
            'event_images'
        ).get(id=event_id, status=Event.PUBLISHED)

        # Prepare data for caching
        event_data = {
            'id': str(event.id),
            'title': event.title,
            'slug': event.slug,
            'description': event.description,
            'category': event.category,
            'venue_name': event.venue_name,
            'venue_address': event.venue_address,
            'latitude': str(event.latitude) if event.latitude else None,
            'longitude': str(event.longitude) if event.longitude else None,
            'start_datetime': event.start_datetime.isoformat(),
            'end_datetime': event.end_datetime.isoformat(),
            'capacity': event.capacity,
            'is_free': event.is_free,
            'status': event.status,
            'organizer_id': str(event.organizer.id),
            'organizer_name': event.organizer.company_name or event.organizer.email,
            'min_price': float(event.min_price),
            'max_price': float(event.max_price),
            'is_sold_out': event.is_sold_out,
            'is_upcoming': event.is_upcoming,
        }

        # Cache the data
        cache.set(cache_key, event_data, timeout)

        return event_data

    except Event.DoesNotExist:
        return None


def invalidate_event_cache(event_id):
    """
    Invalidate cached event data

    Args:
        event_id (UUID): Event ID to invalidate
    """
    cache_key = f'event_{event_id}'
    cache.delete(cache_key)


def get_nearby_events(latitude, longitude, radius_km=50, limit=10):
    """
    Get events near a location within a radius

    Args:
        latitude (float): User's latitude
        longitude (float): User's longitude
        radius_km (int): Search radius in kilometers (default 50km)
        limit (int): Maximum number of results (default 10)

    Returns:
        QuerySet: Events within the radius, ordered by distance
    """
    from django.db.models import Q
    from django.utils import timezone

    # Get all published upcoming events with coordinates
    events = Event.objects.filter(
        status=Event.PUBLISHED,
        start_datetime__gte=timezone.now(),
        latitude__isnull=False,
        longitude__isnull=False
    ).select_related('organizer')

    # Calculate distance for each event and filter by radius
    nearby_events = []
    for event in events:
        distance = calculate_distance(
            latitude, longitude,
            event.latitude, event.longitude
        )

        if distance <= radius_km:
            event.distance = distance
            nearby_events.append(event)

    # Sort by distance
    nearby_events.sort(key=lambda e: e.distance)

    return nearby_events[:limit]


def get_featured_events(limit=6):
    """
    Get featured events (most popular/upcoming)

    Args:
        limit (int): Maximum number of events to return

    Returns:
        QuerySet: Featured events

    Note:
        This is a basic implementation. In production, you could use:
        - Admin-selected featured events
        - Events with most bookings
        - Promoted events
        - AI-recommended events based on user preferences
    """
    from django.utils import timezone

    # For now, return upcoming published events ordered by creation date
    return Event.objects.filter(
        status=Event.PUBLISHED,
        start_datetime__gte=timezone.now()
    ).select_related('organizer').prefetch_related('ticket_types')[:limit]


def get_event_categories():
    """
    Get all available event categories

    Returns:
        list: List of category dictionaries with value and label
    """
    return [
        {'value': choice[0], 'label': choice[1]}
        for choice in Event.CATEGORY_CHOICES
    ]


def search_events(query, filters=None):
    """
    Search events with full-text search

    Args:
        query (str): Search query
        filters (dict): Additional filters (category, date_range, etc.)

    Returns:
        QuerySet: Matching events

    Note:
        This is a basic implementation using icontains.
        In production, use PostgreSQL full-text search or Elasticsearch.
    """
    from django.db.models import Q
    from django.utils import timezone

    # Base queryset - only published upcoming events
    events = Event.objects.filter(
        status=Event.PUBLISHED,
        start_datetime__gte=timezone.now()
    )

    # Apply search query
    if query:
        events = events.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(venue_name__icontains=query) |
            Q(tags__contains=[query])
        )

    # Apply additional filters
    if filters:
        if filters.get('category'):
            events = events.filter(category=filters['category'])

        if filters.get('is_free') is not None:
            events = events.filter(is_free=filters['is_free'])

        if filters.get('start_date'):
            events = events.filter(start_datetime__gte=filters['start_date'])

        if filters.get('end_date'):
            events = events.filter(end_datetime__lte=filters['end_date'])

    return events.select_related('organizer').prefetch_related('ticket_types')

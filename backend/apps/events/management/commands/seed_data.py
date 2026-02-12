"""
Management command to seed the database with test data.
Creates an organizer, attendee, and sample events across categories.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.users.models import User, Attendee
from apps.events.models import Event, TicketType


EVENTS_DATA = [
    {
        'title': 'Nairobi Afrobeats Night',
        'category': 'MUSIC',
        'description': 'An electrifying night of Afrobeats, Amapiano, and Bongo Flava with top DJs and live performances. Dance the night away under the Nairobi sky.',
        'venue_name': 'Carnivore Grounds',
        'venue_address': 'Langata Road, Nairobi',
        'latitude': Decimal('-1.3280'),
        'longitude': Decimal('36.7660'),
        'capacity': 2000,
        'tags': ['afrobeats', 'amapiano', 'live-music', 'nightlife'],
    },
    {
        'title': 'Nairobi Marathon 2026',
        'category': 'SPORTS',
        'description': 'Join thousands of runners in the annual Nairobi Marathon. Routes include full marathon, half marathon, and 10km fun run through the city.',
        'venue_name': 'Nyayo National Stadium',
        'venue_address': 'Mombasa Road, Nairobi',
        'latitude': Decimal('-1.3050'),
        'longitude': Decimal('36.8270'),
        'capacity': 5000,
        'tags': ['marathon', 'running', 'fitness', 'outdoor'],
    },
    {
        'title': 'East Africa Tech Summit',
        'category': 'CONFERENCE',
        'description': 'The premier technology conference in East Africa. Featuring keynotes from industry leaders, startup showcases, and panels on AI, fintech, and mobile innovation.',
        'venue_name': 'Kenyatta International Convention Centre',
        'venue_address': 'City Hall Way, Nairobi',
        'latitude': Decimal('-1.2864'),
        'longitude': Decimal('36.8172'),
        'capacity': 1500,
        'tags': ['tech', 'AI', 'fintech', 'startups', 'innovation'],
    },
    {
        'title': 'Startup Funding Masterclass',
        'category': 'BUSINESS',
        'description': 'Learn how to raise capital for your startup from VCs, angel investors, and grant providers active in the African market. Includes pitch practice sessions.',
        'venue_name': 'iHub Nairobi',
        'venue_address': 'Senteu Plaza, Galana Road, Kilimani',
        'latitude': Decimal('-1.3001'),
        'longitude': Decimal('36.7846'),
        'capacity': 200,
        'tags': ['startup', 'funding', 'VC', 'entrepreneurship'],
    },
    {
        'title': 'Nairobi Comedy Night',
        'category': 'ENTERTAINMENT',
        'description': 'An evening of non-stop laughter featuring Kenya\'s top comedians. Enjoy stand-up, improv, and sketch comedy with food and drinks.',
        'venue_name': 'Kenya National Theatre',
        'venue_address': 'Harry Thuku Road, Nairobi',
        'latitude': Decimal('-1.2780'),
        'longitude': Decimal('36.8180'),
        'capacity': 800,
        'tags': ['comedy', 'standup', 'entertainment', 'nightlife'],
    },
    {
        'title': 'Python & Django Workshop',
        'category': 'WORKSHOP',
        'description': 'Hands-on workshop covering Django REST Framework, deployment with Docker, and building production-ready APIs. Suitable for intermediate developers.',
        'venue_name': 'Moringa School',
        'venue_address': 'Ngong Lane, Nairobi',
        'latitude': Decimal('-1.3000'),
        'longitude': Decimal('36.7800'),
        'capacity': 50,
        'tags': ['python', 'django', 'workshop', 'coding', 'API'],
    },
    {
        'title': 'Koroga Festival',
        'category': 'FESTIVAL',
        'description': 'Kenya\'s iconic outdoor food, wine, and music festival. Enjoy gourmet cuisine, fine wines, and live performances in a stunning garden setting.',
        'venue_name': 'Bomas of Kenya',
        'venue_address': 'Langata South Road, Nairobi',
        'latitude': Decimal('-1.3400'),
        'longitude': Decimal('36.7540'),
        'capacity': 3000,
        'tags': ['festival', 'food', 'wine', 'music', 'outdoor'],
    },
    {
        'title': 'Run for Education Charity',
        'category': 'CHARITY',
        'description': 'A charity run to raise funds for underprivileged schools in Turkana County. All proceeds go directly to building classrooms and providing school supplies.',
        'venue_name': 'Uhuru Gardens',
        'venue_address': 'Langata Road, Nairobi',
        'latitude': Decimal('-1.3240'),
        'longitude': Decimal('36.8100'),
        'capacity': 1000,
        'is_free': True,
        'tags': ['charity', 'education', 'running', 'community'],
    },
    {
        'title': 'Nairobi Tech Professionals Mixer',
        'category': 'NETWORKING',
        'description': 'Monthly networking event for tech professionals in Nairobi. Meet developers, designers, product managers, and founders over drinks and appetizers.',
        'venue_name': 'Alchemist Bar',
        'venue_address': 'Parklands Road, Nairobi',
        'latitude': Decimal('-1.2620'),
        'longitude': Decimal('36.8130'),
        'capacity': 150,
        'tags': ['networking', 'tech', 'professionals', 'mixer'],
    },
    {
        'title': 'Maasai Cultural Experience',
        'category': 'OTHER',
        'description': 'An immersive cultural experience featuring traditional Maasai dance, storytelling, beadwork workshops, and authentic cuisine. A unique way to experience Kenya\'s heritage.',
        'venue_name': 'Maasai Heritage Centre',
        'venue_address': 'Karen Road, Nairobi',
        'latitude': Decimal('-1.3190'),
        'longitude': Decimal('36.7120'),
        'capacity': 100,
        'tags': ['culture', 'maasai', 'heritage', 'experience'],
    },
    {
        'title': 'Blankets & Wine',
        'category': 'MUSIC',
        'description': 'The legendary outdoor picnic concert experience. Bring your blankets, enjoy great wine, and listen to amazing live performances from African artists.',
        'venue_name': 'Ngong Racecourse',
        'venue_address': 'Ngong Road, Nairobi',
        'latitude': Decimal('-1.3100'),
        'longitude': Decimal('36.7900'),
        'capacity': 4000,
        'tags': ['music', 'wine', 'picnic', 'outdoor', 'live'],
    },
    {
        'title': 'Safari Rally Viewing Party',
        'category': 'SPORTS',
        'description': 'Watch the WRC Safari Rally live on big screens with fellow rally enthusiasts. Includes expert commentary, food trucks, and rally merchandise.',
        'venue_name': 'KICC Rooftop',
        'venue_address': 'City Hall Way, Nairobi',
        'latitude': Decimal('-1.2864'),
        'longitude': Decimal('36.8172'),
        'capacity': 500,
        'tags': ['rally', 'motorsport', 'WRC', 'safari'],
    },
]

TICKET_CONFIGS = {
    'MUSIC': [
        ('REGULAR', 1500, 500),
        ('VIP', 5000, 200),
        ('VVIP', 10000, 50),
    ],
    'SPORTS': [
        ('REGULAR', 500, 1000),
        ('VIP', 2000, 200),
    ],
    'CONFERENCE': [
        ('EARLY_BIRD', 3000, 300),
        ('REGULAR', 5000, 500),
        ('VIP', 10000, 100),
    ],
    'BUSINESS': [
        ('REGULAR', 2000, 100),
        ('VIP', 5000, 30),
    ],
    'ENTERTAINMENT': [
        ('REGULAR', 1000, 400),
        ('VIP', 3000, 100),
    ],
    'WORKSHOP': [
        ('REGULAR', 2500, 30),
        ('STUDENT', 1000, 20),
    ],
    'FESTIVAL': [
        ('EARLY_BIRD', 2000, 500),
        ('REGULAR', 3500, 1000),
        ('VIP', 8000, 200),
        ('VVIP', 15000, 50),
    ],
    'CHARITY': [
        ('REGULAR', 0, 1000),
    ],
    'NETWORKING': [
        ('REGULAR', 500, 100),
        ('VIP', 1500, 30),
    ],
    'OTHER': [
        ('REGULAR', 2000, 60),
        ('VIP', 5000, 20),
    ],
}


class Command(BaseCommand):
    help = 'Seed the database with test organizer, attendee, and sample events'

    def handle(self, *args, **options):
        now = timezone.now()

        # Create organizer
        organizer, created = User.objects.get_or_create(
            email='organizer@tukiohub.com',
            defaults={
                'username': 'tukio_organizer',
                'company_name': 'TukioHub Events',
                'role': 'ORGANIZER',
                'is_active': True,
                'email_verified': True,
                'verification_status': 'APPROVED',
            }
        )
        if created:
            organizer.set_password('Test@1234')
            organizer.save()
            self.stdout.write(self.style.SUCCESS('Created organizer: organizer@tukiohub.com / Test@1234'))
        else:
            self.stdout.write('Organizer already exists')

        # Create attendee
        attendee, created = Attendee.objects.get_or_create(
            email='attendee@tukiohub.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Attendee',
                'phone_number': '+254712345678',
                'is_active': True,
                'email_verified': True,
            }
        )
        if created:
            attendee.set_password('Test@1234')
            attendee.save()
            self.stdout.write(self.style.SUCCESS('Created attendee: attendee@tukiohub.com / Test@1234'))
        else:
            self.stdout.write('Attendee already exists')

        # Create events
        events_created = 0
        for i, data in enumerate(EVENTS_DATA):
            is_free = data.pop('is_free', False)
            tags = data.pop('tags', [])

            # Spread events across the next 3 months
            days_offset = (i * 7) + 5
            start = now + timedelta(days=days_offset, hours=10)
            end = start + timedelta(hours=6)

            event, created = Event.objects.get_or_create(
                title=data['title'],
                defaults={
                    'organizer': organizer,
                    'description': data['description'],
                    'category': data['category'],
                    'venue_name': data['venue_name'],
                    'venue_address': data['venue_address'],
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'capacity': data['capacity'],
                    'is_free': is_free,
                    'start_datetime': start,
                    'end_datetime': end,
                    'status': Event.PUBLISHED,
                    'tags': tags,
                }
            )

            if not created:
                continue

            events_created += 1

            # Create ticket types
            ticket_configs = TICKET_CONFIGS.get(data['category'], [('REGULAR', 1000, 100)])
            for name, price, qty in ticket_configs:
                if is_free:
                    price = 0
                TicketType.objects.create(
                    event=event,
                    name=name,
                    price=Decimal(str(price)),
                    quantity_available=qty,
                    sales_start_date=now,
                    sales_end_date=start,
                )

        self.stdout.write(self.style.SUCCESS(f'Created {events_created} events with ticket types'))
        self.stdout.write(self.style.SUCCESS('Seed complete!'))

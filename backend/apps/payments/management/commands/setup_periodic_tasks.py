"""
Management command to set up periodic tasks for payment processing
"""

from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule


class Command(BaseCommand):
    help = 'Set up periodic tasks for payment processing'

    def handle(self, *args, **options):
        # Create interval schedules
        every_5_minutes, _ = IntervalSchedule.objects.get_or_create(
            every=5,
            period=IntervalSchedule.MINUTES,
        )
        
        every_24_hours, _ = IntervalSchedule.objects.get_or_create(
            every=24,
            period=IntervalSchedule.HOURS,
        )
        
        # Create periodic task for checking pending transactions
        task1, created1 = PeriodicTask.objects.get_or_create(
            task='apps.payments.tasks.check_pending_transactions',
            name='Check Pending M-Pesa Transactions',
            defaults={
                'description': 'Check status of pending M-Pesa transactions every 5 minutes',
                'interval': every_5_minutes,
                'enabled': True,
            }
        )
        
        if created1:
            self.stdout.write(
                self.style.SUCCESS(
                    'Successfully created periodic task: Check Pending M-Pesa Transactions'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    'Periodic task already exists: Check Pending M-Pesa Transactions'
                )
            )
        
        # Create periodic task for cleaning up old pending transactions
        task2, created2 = PeriodicTask.objects.get_or_create(
            task='apps.payments.tasks.cleanup_old_pending_transactions',
            name='Clean Up Old Pending Transactions',
            defaults={
                'description': 'Clean up pending transactions older than 24 hours',
                'interval': every_24_hours,
                'enabled': True,
            }
        )
        
        if created2:
            self.stdout.write(
                self.style.SUCCESS(
                    'Successfully created periodic task: Clean Up Old Pending Transactions'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    'Periodic task already exists: Clean Up Old Pending Transactions'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                'Periodic tasks setup completed successfully'
            )
        )
# Generated migration to set up periodic tasks for payment processing

from django.db import migrations
from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json


def create_periodic_tasks(apps, schema_editor):
    """Create periodic tasks for payment processing"""
    
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
    PeriodicTask.objects.get_or_create(
        task='apps.payments.tasks.check_pending_transactions',
        name='Check Pending M-Pesa Transactions',
        description='Check status of pending M-Pesa transactions every 5 minutes',
        interval=every_5_minutes,
        enabled=True,
    )
    
    # Create periodic task for cleaning up old pending transactions
    PeriodicTask.objects.get_or_create(
        task='apps.payments.tasks.cleanup_old_pending_transactions',
        name='Clean Up Old Pending Transactions',
        description='Clean up pending transactions older than 24 hours',
        interval=every_24_hours,
        enabled=True,
    )


def remove_periodic_tasks(apps, schema_editor):
    """Remove periodic tasks for payment processing"""
    
    PeriodicTask.objects.filter(
        task='apps.payments.tasks.check_pending_transactions'
    ).delete()
    
    PeriodicTask.objects.filter(
        task='apps.payments.tasks.cleanup_old_pending_transactions'
    ).delete()
    
    # Also remove interval schedules if they're only used by these tasks
    # (be careful not to remove schedules used by other tasks)
    from django_celery_beat.models import PeriodicTask, IntervalSchedule
    
    # Remove interval schedules that are not used by any other tasks
    interval_5_min = IntervalSchedule.objects.filter(
        every=5,
        period=IntervalSchedule.MINUTES
    ).first()
    if interval_5_min and not PeriodicTask.objects.filter(interval=interval_5_min).exists():
        interval_5_min.delete()
    
    interval_24_hours = IntervalSchedule.objects.filter(
        every=24,
        period=IntervalSchedule.HOURS
    ).first()
    if interval_24_hours and not PeriodicTask.objects.filter(interval=interval_24_hours).exists():
        interval_24_hours.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0002_remove_transaction_booking_reference_and_more'),
        ('django_celery_beat', '0014_remove_clockedschedule_enabled'),
    ]

    operations = [
        migrations.RunPython(create_periodic_tasks, remove_periodic_tasks),
    ]
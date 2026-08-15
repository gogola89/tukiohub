import pytest


@pytest.fixture(autouse=True)
def _celery_eager(settings):
    """Run @shared_task calls synchronously in tests instead of dispatching to a worker."""
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True

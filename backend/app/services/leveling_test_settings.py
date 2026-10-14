from datetime import timedelta

from app.clock import utc_now
from app.constants import LevelingTestStatus
from app.extensions import db
from app.models.leveling_test_settings import LevelingTestSettings
from app.models.sections import Section
from app.serializers import iso_utc

SETTINGS_ID = 1
QUESTIONS_PER_SECTION_OPTIONS = (3, 6, 9)
INTERVAL_DAYS_OPTIONS = (14, 30, 60, 90)
MIN_COMPLETION_WINDOW_DAYS = 1
MAX_COMPLETION_WINDOW_DAYS = 14
DEFAULTS = {
    "questions_per_section": 3,
    "interval_days": 30,
    "completion_window_days": 7,
}


def get_settings():
    settings = db.session.get(LevelingTestSettings, SETTINGS_ID)
    if settings is None:
        settings = LevelingTestSettings(id=SETTINGS_ID, **DEFAULTS)
    return settings


def settings_json(settings):
    return {
        "questions_per_section": settings.questions_per_section,
        "interval_days": settings.interval_days,
        "completion_window_days": settings.completion_window_days,
        "section_count": Section.query.count(),
        "options": {
            "questions_per_section": list(QUESTIONS_PER_SECTION_OPTIONS),
            "interval_days": list(INTERVAL_DAYS_OPTIONS),
            "completion_window_days": {
                "min": MIN_COMPLETION_WINDOW_DAYS,
                "max": MAX_COMPLETION_WINDOW_DAYS,
            },
        },
    }


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _is_one_of(value, options):
    return _is_int(value) and value in options


def _validation_errors(data):
    errors = []
    if "questions_per_section" in data and not _is_one_of(
        data["questions_per_section"], QUESTIONS_PER_SECTION_OPTIONS
    ):
        errors.append("questions_per_section must be one of: 3, 6, 9")
    if "interval_days" in data and not _is_one_of(data["interval_days"], INTERVAL_DAYS_OPTIONS):
        errors.append("interval_days must be one of: 14, 30, 60, 90")
    if "completion_window_days" in data:
        value = data["completion_window_days"]
        if not _is_int(value) or not MIN_COMPLETION_WINDOW_DAYS <= value <= MAX_COMPLETION_WINDOW_DAYS:
            errors.append(
                f"completion_window_days must be an integer "
                f"{MIN_COMPLETION_WINDOW_DAYS}-{MAX_COMPLETION_WINDOW_DAYS}"
            )
    return errors


def update_settings(data):
    errors = _validation_errors(data)
    if errors:
        return None, errors

    settings = get_settings()
    for field in DEFAULTS:
        if field in data:
            setattr(settings, field, data[field])
    db.session.add(settings)
    db.session.commit()
    return settings, None


def leveling_test_state(student, settings=None, now=None):
    settings = settings or get_settings()
    now = now or utc_now()
    last_completed_at = student.leveling_test_completed_at

    if last_completed_at is None:
        return {
            "status": LevelingTestStatus.NOT_TAKEN,
            "last_completed_at": None,
            "due_at": None,
            "deadline_at": None,
        }

    due_at = last_completed_at + timedelta(days=settings.interval_days)
    deadline_at = due_at + timedelta(days=settings.completion_window_days)
    if now < due_at:
        status = LevelingTestStatus.UP_TO_DATE
    elif now < deadline_at:
        status = LevelingTestStatus.DUE
    else:
        status = LevelingTestStatus.OVERDUE

    return {
        "status": status,
        "last_completed_at": iso_utc(last_completed_at),
        "due_at": iso_utc(due_at),
        "deadline_at": iso_utc(deadline_at),
    }

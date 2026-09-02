from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.models import User, UserRole


def seed_demo(db: Session) -> None:
    """Idempotently provision the configured local administrator.

    The password is deliberately required through ADMIN_PASSWORD so a credential
    can never be committed to the repository or baked into an image.
    """
    settings = get_settings()
    if not settings.ADMIN_PASSWORD:
        return
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if existing:
        return
    password_hash = hash_password(settings.ADMIN_PASSWORD)
    db.add(User(
        email=settings.ADMIN_EMAIL,
        full_name=settings.ADMIN_USERNAME,
        role=UserRole.HOSPITAL_ADMIN.value,
        password_hash=password_hash,
        hashed_password=password_hash,
        is_active=True,
        is_verified=True,
    ))
    db.commit()

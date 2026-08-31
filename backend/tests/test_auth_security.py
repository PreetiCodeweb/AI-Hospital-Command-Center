import pytest
from pydantic import ValidationError

from app.core.security import hash_password, verify_password
from app.schemas.schemas import UserCreate


def test_user_create_rejects_oversized_passwords():
    with pytest.raises(ValidationError):
        UserCreate(email='new-user@example.com', password='a' * 73, full_name='Test User')


def test_bcrypt_hash_handles_max_supported_password_length():
    password = 'a' * 72
    hashed = hash_password(password)

    assert verify_password(password, hashed)

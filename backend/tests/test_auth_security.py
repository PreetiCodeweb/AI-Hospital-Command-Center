import pytest
from pydantic import ValidationError

from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.schemas import UserCreate, UserProfileUpdate


def test_user_create_rejects_oversized_passwords():
    with pytest.raises(ValidationError):
        UserCreate(email='new-user@example.com', password='a' * 73, full_name='Test User')


def test_user_create_accepts_six_character_passwords():
    user = UserCreate(email='six-char@example.com', password='428570', full_name='Six Character User')

    assert user.password == '428570'


def test_bcrypt_hash_handles_max_supported_password_length():
    password = 'a' * 72
    hashed = hash_password(password)

    assert verify_password(password, hashed)


def test_access_token_contains_role_claim():
    token = create_access_token("admin@example.com", "hospital_admin")
    claims = jwt.decode(token, get_settings().SECRET_KEY, algorithms=["HS256"])

    assert claims["sub"] == "admin@example.com"
    assert claims["role"] == "hospital_admin"


def test_user_profile_update_accepts_valid_display_name():
    profile = UserProfileUpdate(full_name='Dr. Avery Chen')

    assert profile.full_name == 'Dr. Avery Chen'

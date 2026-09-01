import os

from app.core.config import Settings


def test_settings_have_safe_defaults_for_deployment(monkeypatch):
    for key in [
        "DATABASE_URL",
        "SECRET_KEY",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
    ]:
        monkeypatch.delenv(key, raising=False)

    settings = Settings()

    assert settings.DATABASE_URL.startswith("postgresql")
    assert settings.SECRET_KEY
    assert settings.SMTP_HOST == "localhost"
    assert settings.SMTP_PORT == 587
    assert settings.SMTP_USERNAME == ""
    assert settings.SMTP_PASSWORD == ""
    assert settings.SMTP_FROM_EMAIL == "noreply@example.com"

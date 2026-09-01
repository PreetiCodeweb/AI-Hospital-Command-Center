import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from app.core.config import get_settings

settings = get_settings()


def send_verification_email(email: str, token: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        return

    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email?token={quote(token)}"
    )

    message = EmailMessage()
    message["Subject"] = "Verify your email"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = email
    message.set_content(
        f"Welcome!\n\n"
        f"Verify your email by opening this link:\n{verification_url}\n\n"
        f"This link expires in 24 hours."
    )

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        return

    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)

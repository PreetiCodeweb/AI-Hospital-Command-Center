import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import Token, UserCreate, UserOut
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

VERIFICATION_TOKEN_EXPIRY_HOURS = 24


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    password_hash = hash_password(payload.password)
    raw_verification_token = secrets.token_urlsafe(32)

    user = User(
        email=payload.email,
        hashed_password=password_hash,
        password_hash=password_hash,  # Required 
        full_name=payload.full_name,
        role=payload.role,
        is_verified=False,
        verification_token_hash=_token_hash(raw_verification_token),
        verification_token_expires_at=(
            datetime.now(timezone.utc) + timedelta(hours=24)
        ),
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.verification_token_hash == _token_hash(token))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token",
        )

    if (
        not user.verification_token_expires_at
        or user.verification_token_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    user.is_verified = True
    user.verification_token_hash = None
    user.verification_token_expires_at = None

    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form.username).first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email before logging in",
        )

    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

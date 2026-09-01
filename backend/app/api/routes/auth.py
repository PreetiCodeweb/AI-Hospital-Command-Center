import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import AdminUserCreate, Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

VERIFICATION_TOKEN_EXPIRY_HOURS = 24


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == payload.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    password_hash = hash_password(payload.password)
    user = User(
        email=payload.email,
        hashed_password=password_hash,
        password_hash=password_hash,
        full_name=payload.full_name,
        # Public registration must never be able to select a privileged role.
        role="operations_manager",
        # The application has no email-verification screen or configured mail
        # transport by default, so accounts are immediately usable.
        is_verified=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {"system_admin", "hospital_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required",
        )
    return current_user


@router.get("/users", response_model=list[UserOut])
def list_users(
    _: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.full_name.asc()).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    _: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    allowed_roles = {"hospital_admin", "doctor", "nurse", "operations_manager"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid user role")

    password_hash = hash_password(payload.password)
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password_hash=password_hash,
        hashed_password=password_hash,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    db.delete(user)
    db.commit()


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

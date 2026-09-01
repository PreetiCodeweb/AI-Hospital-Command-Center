from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.models import BedOrder, Review, User, UserRole
from app.schemas.schemas import BedOrderCreate, BedOrderOut, ReviewCreate, ReviewOut

router = APIRouter(prefix="/admin", tags=["Admin"])


def check_admin(current_user: User = Depends(get_current_user)):
    """Check if the current user is an admin."""
    if current_user.role not in [UserRole.SYSTEM_ADMIN.value, UserRole.HOSPITAL_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("/bed-orders", response_model=list[BedOrderOut])
def get_bed_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin),
):
    """Get all bed orders (admin only)."""
    orders = db.query(BedOrder).order_by(desc(BedOrder.order_date)).all()
    return orders


@router.post("/bed-orders", response_model=BedOrderOut, status_code=status.HTTP_201_CREATED)
def create_bed_order(
    payload: BedOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a bed order for the current user."""
    bed_order = BedOrder(
        user_id=current_user.id,
        bed_id=UUID(payload.bed_id),
        department_id=UUID(payload.department_id),
        notes=payload.notes,
    )
    db.add(bed_order)
    db.commit()
    db.refresh(bed_order)
    return bed_order


@router.get("/reviews", response_model=list[ReviewOut])
def get_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin),
):
    """Get all reviews (admin only)."""
    reviews = db.query(Review).order_by(desc(Review.review_date)).all()
    return reviews


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a review for the current user."""
    review = Review(
        user_id=current_user.id,
        bed_order_id=UUID(payload.bed_order_id) if payload.bed_order_id else None,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

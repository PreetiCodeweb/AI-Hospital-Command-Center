from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.models import BedOrder, Review, User, UserRole
from app.schemas.schemas import BedOrderCreate, BedOrderOut, BedOrderStatusUpdate, ReviewCreate, ReviewOut, UserOut

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
        bed_type=payload.bed_type,
        quantity=payload.quantity,
        notes=payload.notes,
    )
    db.add(bed_order)
    db.commit()
    db.refresh(bed_order)
    return bed_order


@router.get("/users", response_model=list[UserOut])
def list_admin_users(_: User = Depends(check_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.full_name.asc()).all()


@router.get("/orders", response_model=list[BedOrderOut])
def list_admin_orders(_: User = Depends(check_admin), db: Session = Depends(get_db)):
    return db.query(BedOrder).order_by(desc(BedOrder.order_date)).all()


@router.patch("/orders/{order_id}", response_model=BedOrderOut)
def update_order_status(order_id: UUID, payload: BedOrderStatusUpdate, _: User = Depends(check_admin), db: Session = Depends(get_db)):
    if payload.status not in {"pending", "approved", "fulfilled", "rejected"}:
        raise HTTPException(status_code=422, detail="Invalid order status")
    order = db.query(BedOrder).filter(BedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Bed order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


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

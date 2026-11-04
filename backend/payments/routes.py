from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.payments import controller
from backend.schemas.payment_views import PaymentListResponse, PaymentOptionsResponse, PaymentView
from backend.schemas.payments import PaymentCreate


router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/options", response_model=PaymentOptionsResponse)
def options(db: Session = Depends(get_db)):
    return controller.payment_options(db)


@router.get("/member/{member_id}", response_model=PaymentListResponse)
def member_history(member_id: str, search: str | None = Query(default=None, max_length=100), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    return controller.list_payments(db, search=search, member_id=member_id, skip=skip, limit=limit)


@router.get("", response_model=PaymentListResponse)
def payments(search: str | None = Query(default=None, max_length=100), date_from: date | None = None, date_to: date | None = None, payment_mode: str | None = Query(default=None, max_length=20), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    if date_from and date_to and date_from > date_to:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Start date must be on or before end date")
    return controller.list_payments(db, search=search, date_from=date_from, date_to=date_to, payment_mode=payment_mode, skip=skip, limit=limit)


@router.get("/{payment_id}", response_model=PaymentView)
def payment(payment_id: str, db: Session = Depends(get_db)):
    return controller.get_payment(db, payment_id)


@router.post("", response_model=PaymentView, status_code=status.HTTP_201_CREATED)
def create(payment: PaymentCreate, db: Session = Depends(get_db)):
    return controller.create_payment(db, payment)

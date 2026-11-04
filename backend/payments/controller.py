from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.payments import service
from backend.schemas.payments import PaymentCreate


def _database_error(db):
    db.rollback()
    raise HTTPException(status_code=503, detail="Payment service is temporarily unavailable") from None


def list_payments(db, **filters):
    try:
        return service.list_payments(db, **filters)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)


def get_payment(db, payment_id):
    try:
        payment = service.get_payment(db, payment_id)
    except SQLAlchemyError:
        _database_error(db)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


def payment_options(db):
    try:
        return service.payment_options(db)
    except SQLAlchemyError:
        _database_error(db)


def create_payment(db, payment: PaymentCreate):
    try:
        return service.create_payment(db, payment)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A payment with this ID already exists or a reference is invalid") from None
    except SQLAlchemyError:
        _database_error(db)

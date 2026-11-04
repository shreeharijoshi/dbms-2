from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.schemas.membership_views import SubscriptionStatusUpdate
from backend.schemas.subscription_requests import SubscriptionEnrollRequest, SubscriptionRenewRequest
from backend.subscriptions import service


def _database_error(db: Session):
    db.rollback()
    raise HTTPException(status_code=503, detail="Subscription service is temporarily unavailable") from None


def list_subscriptions(db: Session, search, status, skip, limit):
    try:
        return service.list_subscriptions(db, search, status, skip, limit)
    except SQLAlchemyError:
        _database_error(db)


def list_member_subscriptions(db: Session, member_id: str, search, skip, limit):
    try:
        return service.list_member_subscriptions(db, member_id, search, skip, limit)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)


def list_expiring_subscriptions(db: Session, search, skip, limit):
    try:
        return service.list_expiring_subscriptions(db, search, skip, limit)
    except SQLAlchemyError:
        _database_error(db)


def get_options(db: Session):
    try:
        return service.get_subscription_options(db)
    except SQLAlchemyError:
        _database_error(db)


def enroll(db: Session, request: SubscriptionEnrollRequest):
    try:
        return service.enroll_member(db, request)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A conflicting subscription could not be created") from None
    except SQLAlchemyError:
        _database_error(db)


def renew(db: Session, membership_id: str, request: SubscriptionRenewRequest):
    try:
        return service.renew_subscription(db, membership_id, request)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A conflicting renewal could not be created") from None
    except SQLAlchemyError:
        _database_error(db)


def update_status(db: Session, membership_id: str, request: SubscriptionStatusUpdate):
    try:
        subscription = service.update_subscription_status(db, membership_id, request)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


def delete_subscription(db: Session, membership_id: str):
    try:
        found, reason = service.delete_subscription(db, membership_id)
    except SQLAlchemyError:
        _database_error(db)
    if not found:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if reason:
        raise HTTPException(status_code=409, detail=reason)
    return {"message": "Subscription deleted successfully"}

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.membership_plans import service
from backend.schemas.membership_plans import MembershipPlanCreate, MembershipPlanUpdate


def _database_error(db: Session):
    db.rollback()
    raise HTTPException(status_code=503, detail="Membership plan service is temporarily unavailable") from None


def list_plans(db: Session, search, duration, skip, limit):
    try:
        return service.list_plans(db, search, duration, skip, limit)
    except SQLAlchemyError:
        _database_error(db)


def get_plan_filters(db: Session):
    try:
        return service.get_plan_filters(db)
    except SQLAlchemyError:
        _database_error(db)


def get_plan(db: Session, plan_id: str):
    try:
        plan = service.get_plan(db, plan_id)
    except SQLAlchemyError:
        _database_error(db)
    if plan is None:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return plan


def create_plan(db: Session, plan: MembershipPlanCreate):
    try:
        return service.create_plan(db, plan)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A membership plan with this ID already exists") from None
    except SQLAlchemyError:
        _database_error(db)


def update_plan(db: Session, plan_id: str, changes: MembershipPlanUpdate):
    try:
        plan = service.update_plan(db, plan_id, changes)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)
    if plan is None:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return plan


def delete_plan(db: Session, plan_id: str):
    try:
        found, reason = service.delete_plan(db, plan_id)
    except SQLAlchemyError:
        _database_error(db)
    if not found:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    if reason:
        raise HTTPException(status_code=409, detail=reason)
    return {"message": "Membership plan deleted successfully"}

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.members import service
from backend.schemas.members import MemberCreate, MemberUpdate


def _database_error(db: Session):
    db.rollback()
    raise HTTPException(status_code=503, detail="Member service is temporarily unavailable") from None


def list_members(db: Session, search, gender, trainer_id, skip, limit):
    try:
        return service.list_members(db, search, gender, trainer_id, skip, limit)
    except SQLAlchemyError:
        _database_error(db)


def get_member(db: Session, member_id: str):
    try:
        member = service.get_member(db, member_id)
    except SQLAlchemyError:
        _database_error(db)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def list_trainers(db: Session):
    try:
        return service.list_trainers(db)
    except SQLAlchemyError:
        _database_error(db)


def create_member(db: Session, member: MemberCreate):
    try:
        return service.create_member(db, member)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A member with this ID already exists") from None
    except SQLAlchemyError:
        _database_error(db)


def update_member(db: Session, member_id: str, changes: MemberUpdate):
    try:
        member = service.update_member(db, member_id, changes)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def delete_member(db: Session, member_id: str):
    try:
        found, blocked_reason = service.delete_member(db, member_id)
    except SQLAlchemyError:
        _database_error(db)
    if not found:
        raise HTTPException(status_code=404, detail="Member not found")
    if blocked_reason:
        raise HTTPException(status_code=409, detail=blocked_reason)
    return {"message": "Member deleted successfully"}

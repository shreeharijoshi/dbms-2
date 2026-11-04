from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.schemas.gym_trainers import GymTrainerCreate, GymTrainerUpdate
from backend.trainers import service


def _database_error(db: Session):
    db.rollback()
    raise HTTPException(status_code=503, detail="Trainer service is temporarily unavailable") from None


def list_trainers(db: Session, search, speciality, shift, skip, limit):
    try:
        return service.list_trainers(db, search, speciality, shift, skip, limit)
    except SQLAlchemyError:
        _database_error(db)


def list_filter_options(db: Session):
    try:
        return service.list_filter_options(db)
    except SQLAlchemyError:
        _database_error(db)


def get_trainer(db: Session, employee_id: str):
    try:
        trainer = service.get_trainer(db, employee_id)
    except SQLAlchemyError:
        _database_error(db)
    if trainer is None:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer


def list_assigned_members(db: Session, employee_id: str):
    get_trainer(db, employee_id)
    try:
        return service.list_assigned_members(db, employee_id)
    except SQLAlchemyError:
        _database_error(db)


def create_trainer(db: Session, trainer: GymTrainerCreate):
    try:
        return service.create_trainer(db, trainer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A trainer with this employee ID already exists") from None
    except SQLAlchemyError:
        _database_error(db)


def update_trainer(db: Session, employee_id: str, changes: GymTrainerUpdate):
    try:
        trainer = service.update_trainer(db, employee_id, changes)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)
    if trainer is None:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer


def delete_trainer(db: Session, employee_id: str):
    try:
        found, blocked_reason = service.delete_trainer(db, employee_id)
    except SQLAlchemyError:
        _database_error(db)
    if not found:
        raise HTTPException(status_code=404, detail="Trainer not found")
    if blocked_reason:
        raise HTTPException(status_code=409, detail=blocked_reason)
    return {"message": "Trainer deleted successfully"}

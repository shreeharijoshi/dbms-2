from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from backend.trainer_portal import service


def _call(db, operation, *args):
    try:
        return operation(db, *args)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=503, detail="Trainer workspace is temporarily unavailable") from None


def overview(db, trainer_id): return _call(db, service.overview, trainer_id)
def list_members(db, trainer_id, search, skip, limit): return _call(db, service.list_members, trainer_id, search, skip, limit)
def get_member(db, trainer_id, member_id): return _call(db, service.get_member, trainer_id, member_id)
def profile(db, trainer_id): return _call(db, service.profile, trainer_id)
def options(db): return _call(db, service.options)

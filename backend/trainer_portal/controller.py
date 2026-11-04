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


def overview(db, user): return _call(db, service.overview, user)
def list_members(db, user, search, skip, limit): return _call(db, service.list_members, user, search, skip, limit)
def get_member(db, user, member_id): return _call(db, service.get_member, user, member_id)
def profile(db, user): return _call(db, service.profile, user)

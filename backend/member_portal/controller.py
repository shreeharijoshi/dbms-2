from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from backend.member_portal import service
from backend.schemas.member_portal import MemberContactUpdate


def _call(db, operation, *args):
    try:
        return operation(db, *args)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=503, detail="Member workspace is temporarily unavailable") from None


def profile(db, user): return _call(db, service.profile, user)
def update_contact(db, user, request: MemberContactUpdate): return _call(db, service.update_contact, user, request)
def memberships(db, user): return _call(db, service.memberships, user)
def payment_list(db, user, skip, limit): return _call(db, service.payment_list, user, skip, limit)
def payment_detail(db, user, payment_id): return _call(db, service.payment_detail, user, payment_id)
def trainer(db, user): return _call(db, service.trainer, user)
def overview(db, user): return _call(db, service.overview, user)

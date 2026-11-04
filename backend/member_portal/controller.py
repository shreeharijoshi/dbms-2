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


def profile(db, member_id): return _call(db, service.profile, member_id)
def update_contact(db, member_id, request: MemberContactUpdate): return _call(db, service.update_contact, member_id, request)
def memberships(db, member_id): return _call(db, service.memberships, member_id)
def payment_list(db, member_id, skip, limit): return _call(db, service.payment_list, member_id, skip, limit)
def payment_detail(db, member_id, payment_id): return _call(db, service.payment_detail, member_id, payment_id)
def trainer(db, member_id): return _call(db, service.trainer, member_id)
def overview(db, member_id): return _call(db, service.overview, member_id)
def options(db): return _call(db, service.options)

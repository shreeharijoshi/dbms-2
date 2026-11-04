from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.member_portal import controller
from backend.schemas.member_portal import MemberContactUpdate, MemberPortalMemberships, MemberPortalOverview, MemberPortalPayment, MemberPortalPaymentList, MemberPortalProfile, MemberPortalTrainer

router = APIRouter(prefix="/member-portal", tags=["member workspace"])


@router.get("/options")
def options(db: Session = Depends(get_db)):
    return controller.options(db)


@router.get("/{member_id}/overview", response_model=MemberPortalOverview)
def overview(member_id: str, db: Session = Depends(get_db)):
    return controller.overview(db, member_id)


@router.get("/{member_id}/profile", response_model=MemberPortalProfile)
def profile(member_id: str, db: Session = Depends(get_db)):
    return controller.profile(db, member_id)


@router.patch("/{member_id}/profile", response_model=MemberPortalProfile)
def update_profile(member_id: str, request: MemberContactUpdate, db: Session = Depends(get_db)):
    return controller.update_contact(db, member_id, request)


@router.get("/{member_id}/membership", response_model=MemberPortalMemberships)
def memberships(member_id: str, db: Session = Depends(get_db)):
    return controller.memberships(db, member_id)


@router.get("/{member_id}/payments", response_model=MemberPortalPaymentList)
def payments(member_id: str, skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    return controller.payment_list(db, member_id, skip, limit)


@router.get("/{member_id}/payments/{payment_id}", response_model=MemberPortalPayment)
def payment(member_id: str, payment_id: str, db: Session = Depends(get_db)):
    return controller.payment_detail(db, member_id, payment_id)


@router.get("/{member_id}/trainer", response_model=MemberPortalTrainer | None)
def trainer(member_id: str, db: Session = Depends(get_db)):
    return controller.trainer(db, member_id)

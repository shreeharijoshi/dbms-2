from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.member_portal import controller
from backend.middleware.authorization import require_roles
from backend.schemas.auth import AuthenticatedUser
from backend.schemas.member_portal import MemberContactUpdate, MemberPortalMemberships, MemberPortalMessage, MemberPortalOverview, MemberPortalPayment, MemberPortalPaymentList, MemberPortalProfile, MemberPortalTrainer


router = APIRouter(prefix="/member-portal", tags=["member workspace"], dependencies=[Depends(require_roles("Member"))])


@router.get("/overview", response_model=MemberPortalOverview)
def overview(user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.overview(db, user)


@router.get("/profile", response_model=MemberPortalProfile)
def profile(user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.profile(db, user)


@router.patch("/profile", response_model=MemberPortalProfile)
def update_profile(request: MemberContactUpdate, user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.update_contact(db, user, request)


@router.get("/membership", response_model=MemberPortalMemberships)
def memberships(user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.memberships(db, user)


@router.get("/payments", response_model=MemberPortalPaymentList)
def payments(skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.payment_list(db, user, skip, limit)


@router.get("/payments/{payment_id}", response_model=MemberPortalPayment)
def payment(payment_id: str, user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.payment_detail(db, user, payment_id)


@router.get("/trainer", response_model=MemberPortalTrainer | None)
def trainer(user: AuthenticatedUser = Depends(require_roles("Member")), db: Session = Depends(get_db)):
    return controller.trainer(db, user)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.middleware.authorization import require_roles
from backend.schemas.auth import AuthenticatedUser
from backend.schemas.trainer_portal import TrainerPortalMemberDetail, TrainerPortalMemberList, TrainerPortalOverview, TrainerPortalProfile
from backend.trainer_portal import controller


router = APIRouter(prefix="/trainer-portal", tags=["trainer workspace"], dependencies=[Depends(require_roles("Trainer"))])


@router.get("/overview", response_model=TrainerPortalOverview)
def overview(user: AuthenticatedUser = Depends(require_roles("Trainer")), db: Session = Depends(get_db)):
    return controller.overview(db, user)


@router.get("/members", response_model=TrainerPortalMemberList)
def members(search: str | None = Query(default=None, max_length=100), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), user: AuthenticatedUser = Depends(require_roles("Trainer")), db: Session = Depends(get_db)):
    return controller.list_members(db, user, search, skip, limit)


@router.get("/members/{member_id}", response_model=TrainerPortalMemberDetail)
def member(member_id: str, user: AuthenticatedUser = Depends(require_roles("Trainer")), db: Session = Depends(get_db)):
    return controller.get_member(db, user, member_id)


@router.get("/profile", response_model=TrainerPortalProfile)
def profile(user: AuthenticatedUser = Depends(require_roles("Trainer")), db: Session = Depends(get_db)):
    return controller.profile(db, user)

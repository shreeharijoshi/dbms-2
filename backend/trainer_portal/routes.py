from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.schemas.trainer_portal import TrainerPortalMemberDetail, TrainerPortalMemberList, TrainerPortalOverview, TrainerPortalProfile
from backend.trainer_portal import controller

router = APIRouter(prefix="/trainer-portal", tags=["trainer workspace"])


@router.get("/options")
def options(db: Session = Depends(get_db)):
    return controller.options(db)


@router.get("/{employee_id}/overview", response_model=TrainerPortalOverview)
def overview(employee_id: str, db: Session = Depends(get_db)):
    return controller.overview(db, employee_id)


@router.get("/{employee_id}/members", response_model=TrainerPortalMemberList)
def members(employee_id: str, search: str | None = Query(default=None, max_length=100), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    return controller.list_members(db, employee_id, search, skip, limit)


@router.get("/{employee_id}/members/{member_id}", response_model=TrainerPortalMemberDetail)
def member(employee_id: str, member_id: str, db: Session = Depends(get_db)):
    return controller.get_member(db, employee_id, member_id)


@router.get("/{employee_id}/profile", response_model=TrainerPortalProfile)
def profile(employee_id: str, db: Session = Depends(get_db)):
    return controller.profile(db, employee_id)

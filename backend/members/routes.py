from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.members import controller
from backend.schemas.member_views import (
    MemberDeleteResponse,
    MemberFiltersResponse,
    MemberListResponse,
    MemberView,
)
from backend.schemas.members import MemberCreate, MemberUpdate


router = APIRouter(
    prefix="/members",
    tags=["members"],
)


@router.get("/filters", response_model=MemberFiltersResponse)
def member_filter_options(db: Session = Depends(get_db)):
    return {"trainers": controller.list_trainers(db)}


@router.get("", response_model=MemberListResponse)
def get_members(
    search: str | None = Query(default=None, max_length=100),
    gender: str | None = Query(default=None, max_length=10),
    trainer_id: str | None = Query(default=None, max_length=20),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_members(db, search, gender, trainer_id, skip, limit)


@router.get("/{member_id}", response_model=MemberView)
def get_member(member_id: str, db: Session = Depends(get_db)):
    return controller.get_member(db, member_id)


@router.post("", response_model=MemberView, status_code=status.HTTP_201_CREATED)
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    return controller.create_member(db, member)


@router.put("/{member_id}", response_model=MemberView)
def update_member(member_id: str, changes: MemberUpdate, db: Session = Depends(get_db)):
    return controller.update_member(db, member_id, changes)


@router.delete("/{member_id}", response_model=MemberDeleteResponse)
def delete_member(member_id: str, db: Session = Depends(get_db)):
    return controller.delete_member(db, member_id)

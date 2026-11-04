from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.schemas.gym_trainers import GymTrainerCreate, GymTrainerUpdate
from backend.schemas.trainer_views import (
    AssignedMemberView,
    TrainerDeleteResponse,
    TrainerListResponse,
    TrainerOptionsResponse,
    TrainerView,
)
from backend.trainers import controller


router = APIRouter(
    prefix="/trainers",
    tags=["trainers"],
)


@router.get("/filters", response_model=TrainerOptionsResponse)
def trainer_filter_options(db: Session = Depends(get_db)):
    return controller.list_filter_options(db)


@router.get("", response_model=TrainerListResponse)
def get_trainers(
    search: str | None = Query(default=None, max_length=100),
    speciality: str | None = Query(default=None, max_length=100),
    shift: str | None = Query(default=None, max_length=20),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_trainers(db, search, speciality, shift, skip, limit)


@router.get("/{employee_id}/members", response_model=list[AssignedMemberView])
def get_assigned_members(employee_id: str, db: Session = Depends(get_db)):
    return controller.list_assigned_members(db, employee_id)


@router.get("/{employee_id}", response_model=TrainerView)
def get_trainer(employee_id: str, db: Session = Depends(get_db)):
    return controller.get_trainer(db, employee_id)


@router.post("", response_model=TrainerView, status_code=status.HTTP_201_CREATED)
def create_trainer(trainer: GymTrainerCreate, db: Session = Depends(get_db)):
    return controller.create_trainer(db, trainer)


@router.put("/{employee_id}", response_model=TrainerView)
def update_trainer(employee_id: str, changes: GymTrainerUpdate, db: Session = Depends(get_db)):
    return controller.update_trainer(db, employee_id, changes)


@router.delete("/{employee_id}", response_model=TrainerDeleteResponse)
def delete_trainer(employee_id: str, db: Session = Depends(get_db)):
    return controller.delete_trainer(db, employee_id)

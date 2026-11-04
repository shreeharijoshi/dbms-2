from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.membership_plans import controller
from backend.middleware.authorization import require_roles
from backend.schemas.membership_plans import MembershipPlanCreate, MembershipPlanUpdate
from backend.schemas.membership_views import (
    MembershipPlanFilters,
    MembershipPlanListResponse,
    MembershipPlanView,
    SubscriptionDeleteResponse,
)


router = APIRouter(
    prefix="/membership-plans",
    tags=["membership plans"],
    dependencies=[Depends(require_roles("Admin"))],
)


@router.get("/filters", response_model=MembershipPlanFilters)
def plan_filter_options(db: Session = Depends(get_db)):
    return controller.get_plan_filters(db)


@router.get("", response_model=MembershipPlanListResponse)
def get_plans(
    search: str | None = Query(default=None, max_length=100),
    duration: int | None = Query(default=None, ge=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_plans(db, search, duration, skip, limit)


@router.get("/{plan_id}", response_model=MembershipPlanView)
def get_plan(plan_id: str, db: Session = Depends(get_db)):
    return controller.get_plan(db, plan_id)


@router.post("", response_model=MembershipPlanView, status_code=status.HTTP_201_CREATED)
def create_plan(plan: MembershipPlanCreate, db: Session = Depends(get_db)):
    return controller.create_plan(db, plan)


@router.put("/{plan_id}", response_model=MembershipPlanView)
def update_plan(plan_id: str, changes: MembershipPlanUpdate, db: Session = Depends(get_db)):
    return controller.update_plan(db, plan_id, changes)


@router.delete("/{plan_id}", response_model=SubscriptionDeleteResponse)
def delete_plan(plan_id: str, db: Session = Depends(get_db)):
    return controller.delete_plan(db, plan_id)

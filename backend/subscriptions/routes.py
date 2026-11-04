from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.schemas.membership_views import (
    SubscriptionDeleteResponse,
    SubscriptionListResponse,
    SubscriptionOptionsResponse,
    SubscriptionStatusUpdate,
    SubscriptionView,
)
from backend.schemas.subscription_requests import SubscriptionEnrollRequest, SubscriptionRenewRequest
from backend.subscriptions import controller


router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


@router.get("/options", response_model=SubscriptionOptionsResponse)
def subscription_options(db: Session = Depends(get_db)):
    return controller.get_options(db)


@router.get("/expiring", response_model=SubscriptionListResponse)
def expiring_subscriptions(
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_expiring_subscriptions(db, search, skip, limit)


@router.get("/member/{member_id}", response_model=SubscriptionListResponse)
def member_subscriptions(
    member_id: str,
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_member_subscriptions(db, member_id, search, skip, limit)


@router.get("", response_model=SubscriptionListResponse)
def get_subscriptions(
    search: str | None = Query(default=None, max_length=100),
    status_filter: str | None = Query(default=None, alias="status", max_length=20),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return controller.list_subscriptions(db, search, status_filter, skip, limit)


@router.post("", response_model=SubscriptionView, status_code=status.HTTP_201_CREATED)
def enroll_member(request: SubscriptionEnrollRequest, db: Session = Depends(get_db)):
    return controller.enroll(db, request)


@router.post("/{membership_id}/renew", response_model=SubscriptionView, status_code=status.HTTP_201_CREATED)
def renew_subscription(membership_id: str, request: SubscriptionRenewRequest, db: Session = Depends(get_db)):
    return controller.renew(db, membership_id, request)


@router.patch("/{membership_id}/status", response_model=SubscriptionView)
def update_subscription_status(
    membership_id: str,
    request: SubscriptionStatusUpdate,
    db: Session = Depends(get_db),
):
    return controller.update_status(db, membership_id, request)


@router.delete("/{membership_id}", response_model=SubscriptionDeleteResponse)
def delete_subscription(membership_id: str, db: Session = Depends(get_db)):
    return controller.delete_subscription(db, membership_id)

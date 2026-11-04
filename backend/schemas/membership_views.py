from datetime import date

from pydantic import BaseModel, Field


class MembershipPlanView(BaseModel):
    plan_id: str
    duration: int | None
    price: float | None
    group_discount: float | None
    seasonal_discount: float | None
    subscription_count: int = 0


class MembershipPlanListResponse(BaseModel):
    items: list[MembershipPlanView]
    total: int
    skip: int
    limit: int


class MembershipPlanFilters(BaseModel):
    durations: list[int]


class SubscriptionView(BaseModel):
    membership_id: str
    member_id: str | None
    member_name: str | None
    plan_id: str | None
    duration: int | None
    plan_price: float | None
    group_discount: float | None
    seasonal_discount: float | None
    start_date: date | None
    end_date: date | None
    membership_status: str | None


class SubscriptionListResponse(BaseModel):
    items: list[SubscriptionView]
    total: int
    skip: int
    limit: int


class SubscriptionOptionsMember(BaseModel):
    member_id: str
    member_name: str | None


class SubscriptionOptionsPlan(BaseModel):
    plan_id: str
    duration: int | None
    price: float | None


class SubscriptionOptionsResponse(BaseModel):
    members: list[SubscriptionOptionsMember]
    plans: list[SubscriptionOptionsPlan]


class SubscriptionStatusUpdate(BaseModel):
    membership_status: str = Field(min_length=1, max_length=20)


class SubscriptionDeleteResponse(BaseModel):
    message: str

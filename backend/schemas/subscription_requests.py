from datetime import date

from pydantic import BaseModel, Field


class SubscriptionEnrollRequest(BaseModel):
    member_id: str = Field(min_length=1, max_length=20)
    plan_id: str = Field(min_length=1, max_length=20)
    start_date: date | None = None


class SubscriptionRenewRequest(BaseModel):
    plan_id: str | None = Field(default=None, max_length=20)

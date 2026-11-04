from datetime import date

from pydantic import BaseModel, Field


class MembershipCreate(BaseModel):
    membership_id: str = Field(max_length=20)
    member_id: str = Field(max_length=20)
    plan_id: str = Field(max_length=20)
    start_date: date = Field(default_factory=date.today)
    end_date: date | None = None
    membership_status: str | None = Field(default=None, max_length=20)


class MembershipUpdate(BaseModel):
    member_id: str | None = Field(default=None, max_length=20)
    plan_id: str | None = Field(default=None, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    membership_status: str | None = Field(default=None, max_length=20)

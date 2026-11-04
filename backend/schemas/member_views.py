from datetime import date

from pydantic import BaseModel


class MemberView(BaseModel):
    member_id: str
    member_name: str | None
    gender: str | None
    contact: str | None
    dob: date | None
    height: float | None
    weight: float | None
    bmi: float | None
    trainer_id: str | None
    trainer_name: str | None
    member_status: str


class MemberListResponse(BaseModel):
    items: list[MemberView]
    total: int
    skip: int
    limit: int


class TrainerOption(BaseModel):
    employee_id: str
    trainer_name: str | None


class MemberFiltersResponse(BaseModel):
    trainers: list[TrainerOption]


class MemberDeleteResponse(BaseModel):
    message: str

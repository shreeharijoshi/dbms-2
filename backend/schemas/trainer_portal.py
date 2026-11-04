from datetime import date

from pydantic import BaseModel


class TrainerPortalMember(BaseModel):
    member_id: str
    member_name: str | None
    gender: str | None
    contact: str | None
    dob: date | None
    height: float | None
    weight: float | None
    bmi: float | None
    member_status: str | None
    membership_id: str | None
    plan_id: str | None
    membership_start_date: date | None
    membership_end_date: date | None
    membership_status: str | None


class TrainerPortalMemberList(BaseModel):
    items: list[TrainerPortalMember]
    total: int
    skip: int
    limit: int


class TrainerPortalProfile(BaseModel):
    employee_id: str
    trainer_name: str | None
    dob: date | None
    gender: str | None
    height: float | None
    weight: float | None
    speciality: str | None
    qualification: str | None
    shift: str | None


class TrainerPortalOverview(BaseModel):
    trainer: TrainerPortalProfile
    assigned_member_count: int
    members: list[TrainerPortalMember]


class TrainerPortalMemberDetail(TrainerPortalMember):
    pass

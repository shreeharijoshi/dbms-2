from datetime import date

from pydantic import BaseModel


class TrainerView(BaseModel):
    employee_id: str
    trainer_name: str | None
    dob: date | None
    gender: str | None
    height: float | None
    weight: float | None
    speciality: str | None
    qualification: str | None
    shift: str | None
    assigned_member_count: int = 0


class TrainerListResponse(BaseModel):
    items: list[TrainerView]
    total: int
    skip: int
    limit: int


class TrainerOptionsResponse(BaseModel):
    specialities: list[str]
    shifts: list[str]


class AssignedMemberView(BaseModel):
    member_id: str
    member_name: str | None
    gender: str | None
    contact: str | None
    member_status: str


class TrainerDeleteResponse(BaseModel):
    message: str

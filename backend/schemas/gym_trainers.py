from datetime import date

from pydantic import BaseModel, Field


class GymTrainerCreate(BaseModel):
    employee_id: str = Field(max_length=20)
    trainer_name: str = Field(max_length=100)
    dob: date
    gender: str = Field(max_length=10)
    height: float = Field(gt=0)
    weight: float = Field(gt=0)
    speciality: str = Field(max_length=100)
    qualification: str = Field(max_length=100)
    shift: str = Field(max_length=20)


class GymTrainerUpdate(BaseModel):
    trainer_name: str | None = Field(default=None, max_length=100)
    dob: date | None = None
    gender: str | None = Field(default=None, max_length=10)
    height: float | None = Field(default=None, gt=0)
    weight: float | None = Field(default=None, gt=0)
    speciality: str | None = Field(default=None, max_length=100)
    qualification: str | None = Field(default=None, max_length=100)
    shift: str | None = Field(default=None, max_length=20)

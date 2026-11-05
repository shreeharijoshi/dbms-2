from pydantic import BaseModel, Field, field_validator
from datetime import date


class MemberCreate(BaseModel):
    member_id: str = Field(min_length=1, max_length=20)
    member_name: str = Field(min_length=1, max_length=100)
    gender: str = Field(min_length=1, max_length=10)
    height: float = Field(gt=0, le=300, allow_inf_nan=False)
    weight: float = Field(gt=0, le=500, allow_inf_nan=False)
    contact: str = Field(min_length=1, max_length=15)
    dob: date
    PT: str | None = Field(default=None, max_length=20)

    @field_validator("member_id", "member_name", "gender", "contact")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("PT")
    @classmethod
    def strip_trainer_id(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None

    @field_validator("dob")
    @classmethod
    def birth_date_not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return value

class MemberUpdate(BaseModel):
    member_name: str | None = Field(default=None, min_length=1, max_length=100)
    gender: str | None = Field(default=None, min_length=1, max_length=10)
    height: float | None = Field(default=None, gt=0, le=300, allow_inf_nan=False)
    weight: float | None = Field(default=None, gt=0, le=500, allow_inf_nan=False)
    contact: str | None = Field(default=None, min_length=1, max_length=15)
    dob: date | None = None
    PT: str | None = Field(default=None, max_length=20)

    @field_validator("member_name", "gender", "contact")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("PT")
    @classmethod
    def strip_optional_trainer_id(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None

    @field_validator("dob")
    @classmethod
    def optional_birth_date_not_in_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return value

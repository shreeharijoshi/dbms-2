from datetime import date

from pydantic import BaseModel, Field, field_validator


class MemberPortalProfile(BaseModel):
    member_id: str
    member_name: str | None
    gender: str | None
    dob: date | None
    contact: str | None
    height: float | None
    weight: float | None
    bmi: float | None


class MemberContactUpdate(BaseModel):
    contact: str = Field(min_length=1, max_length=15)

    @field_validator("contact")
    @classmethod
    def non_blank_contact(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Contact cannot be blank")
        return value


class MemberPortalPlan(BaseModel):
    plan_id: str
    duration: int | None
    price: float | None
    group_discount: float | None
    seasonal_discount: float | None


class MemberPortalMembership(BaseModel):
    membership_id: str
    plan_id: str | None
    duration: int | None
    price: float | None
    start_date: date | None
    end_date: date | None
    membership_status: str | None


class MemberPortalMemberships(BaseModel):
    current: MemberPortalMembership | None
    history: list[MemberPortalMembership]
    available_plans: list[MemberPortalPlan]


class MemberPortalPayment(BaseModel):
    payment_id: str
    member_id: str | None
    member_name: str | None
    plan_id: str | None
    amount: float | None
    payment_date: date | None
    payment_mode: str | None


class MemberPortalPaymentList(BaseModel):
    items: list[MemberPortalPayment]
    total: int
    skip: int
    limit: int


class MemberPortalTrainer(BaseModel):
    employee_id: str
    trainer_name: str | None
    speciality: str | None
    qualification: str | None
    shift: str | None


class MemberPortalOverview(BaseModel):
    profile: MemberPortalProfile
    membership: MemberPortalMembership | None
    days_remaining: int | None
    trainer: MemberPortalTrainer | None
    latest_payment: MemberPortalPayment | None


class MemberPortalMessage(BaseModel):
    message: str

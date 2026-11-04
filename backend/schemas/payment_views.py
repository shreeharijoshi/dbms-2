from datetime import date

from pydantic import BaseModel


class PaymentView(BaseModel):
    payment_id: str
    member_id: str | None
    member_name: str | None
    plan_id: str | None
    amount: float | None
    payment_date: date | None
    payment_mode: str | None


class PaymentListResponse(BaseModel):
    items: list[PaymentView]
    total: int
    skip: int
    limit: int


class PaymentOptionsMember(BaseModel):
    member_id: str
    member_name: str | None


class PaymentOptionsPlan(BaseModel):
    plan_id: str


class PaymentOptionsResponse(BaseModel):
    members: list[PaymentOptionsMember]
    plans: list[PaymentOptionsPlan]


class PaymentDeleteResponse(BaseModel):
    message: str

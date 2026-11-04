from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

PaymentMode = Literal["Cash", "Card", "UPI", "Bank Transfer"]


class PaymentCreate(BaseModel):
    payment_id: str = Field(max_length=20)
    member_id: str = Field(max_length=20)
    plan_id: str = Field(max_length=20)
    amount: float = Field(ge=0)
    payment_date: date
    payment_mode: PaymentMode


class PaymentUpdate(BaseModel):
    member_id: str | None = Field(default=None, max_length=20)
    plan_id: str | None = Field(default=None, max_length=20)
    amount: float | None = Field(default=None, ge=0)
    payment_date: date | None = None
    payment_mode: PaymentMode | None = None

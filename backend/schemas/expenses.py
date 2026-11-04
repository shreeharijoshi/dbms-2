from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

ExpenseType = Literal["Salary", "Maintenance"]
PaymentMode = Literal["Cash", "Card", "UPI", "Bank Transfer"]


class ExpenseCreate(BaseModel):
    expense_id: str = Field(max_length=20)
    expense_type: ExpenseType
    trainer_id: str | None = Field(default=None, max_length=20)
    misc_employee_id: str | None = Field(default=None, max_length=20)
    inventory_id: str | None = Field(default=None, max_length=20)
    expense_month: str | None = Field(default=None, max_length=20)
    amount: float = Field(ge=0)
    bonus: float = Field(default=0, ge=0)
    payment_date: date
    payment_mode: PaymentMode
    remarks: str | None = Field(default=None, max_length=100)


class ExpenseUpdate(BaseModel):
    expense_type: ExpenseType | None = None
    trainer_id: str | None = Field(default=None, max_length=20)
    misc_employee_id: str | None = Field(default=None, max_length=20)
    inventory_id: str | None = Field(default=None, max_length=20)
    expense_month: str | None = Field(default=None, max_length=20)
    amount: float | None = Field(default=None, ge=0)
    bonus: float | None = Field(default=None, ge=0)
    payment_date: date | None = None
    payment_mode: PaymentMode | None = None
    remarks: str | None = Field(default=None, max_length=100)

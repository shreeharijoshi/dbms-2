from datetime import date

from pydantic import BaseModel


class ExpenseView(BaseModel):
    expense_id: str
    expense_type: str | None
    trainer_id: str | None
    trainer_name: str | None
    misc_employee_id: str | None
    employee_name: str | None
    inventory_id: str | None
    item_name: str | None
    expense_month: str | None
    amount: float | None
    bonus: float | None
    payment_date: date | None
    payment_mode: str | None
    remarks: str | None


class ExpenseListResponse(BaseModel):
    items: list[ExpenseView]
    total: int
    skip: int
    limit: int


class ExpenseOptionsResponse(BaseModel):
    trainers: list[dict[str, str | None]]
    employees: list[dict[str, str | None]]
    inventory: list[dict[str, str | None]]


class ExpenseDeleteResponse(BaseModel):
    message: str

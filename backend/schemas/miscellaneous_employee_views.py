from pydantic import BaseModel


class MiscellaneousEmployeeView(BaseModel):
    employee_id: str
    employee_name: str | None
    role: str | None
    expense_count: int = 0


class MiscellaneousEmployeeListResponse(BaseModel):
    items: list[MiscellaneousEmployeeView]
    total: int
    skip: int
    limit: int


class EmployeeFilters(BaseModel):
    roles: list[str]


class EmployeeDeleteResponse(BaseModel):
    message: str

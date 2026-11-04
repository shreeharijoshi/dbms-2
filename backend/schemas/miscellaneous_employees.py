from pydantic import BaseModel, Field


class MiscellaneousEmployeeCreate(BaseModel):
    employee_id: str = Field(max_length=20)
    employee_name: str = Field(max_length=100)
    role: str = Field(max_length=50)


class MiscellaneousEmployeeUpdate(BaseModel):
    employee_name: str | None = Field(default=None, max_length=100)
    role: str | None = Field(default=None, max_length=50)

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=254,
        pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$",
    )
    password: str = Field(min_length=1, max_length=1024)


class AuthenticatedUser(BaseModel):
    user_id: int
    role: Literal["Admin", "Trainer", "Member"]
    member_id: str | None = None
    trainer_employee_id: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime
    user: AuthenticatedUser


class MessageResponse(BaseModel):
    message: str

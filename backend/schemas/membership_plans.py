from pydantic import BaseModel, Field


class MembershipPlanCreate(BaseModel):
    plan_id: str = Field(max_length=20)
    duration: int = Field(gt=0)
    price: float = Field(gt=0)
    group_discount: float = Field(ge=0, le=100)
    seasonal_discount: float = Field(ge=0, le=100)


class MembershipPlanUpdate(BaseModel):
    duration: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, gt=0)
    group_discount: float | None = Field(default=None, ge=0, le=100)
    seasonal_discount: float | None = Field(default=None, ge=0, le=100)
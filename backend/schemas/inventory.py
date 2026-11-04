from datetime import date

from pydantic import BaseModel, Field


class InventoryCreate(BaseModel):
    inventory_id: str = Field(max_length=20)
    item_name: str = Field(max_length=100)
    category: str = Field(max_length=50)
    quantity: int = Field(ge=0)
    cost: float = Field(ge=0)
    purchase_date: date
    inventory_status: str = Field(max_length=30)


class InventoryUpdate(BaseModel):
    item_name: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=50)
    quantity: int | None = Field(default=None, ge=0)
    cost: float | None = Field(default=None, ge=0)
    purchase_date: date | None = None
    inventory_status: str | None = Field(default=None, max_length=30)

from datetime import date

from pydantic import BaseModel


class InventoryView(BaseModel):
    inventory_id: str
    item_name: str | None
    category: str | None
    quantity: int | None
    cost: float | None
    purchase_date: date | None
    inventory_status: str | None
    expense_count: int = 0


class InventoryListResponse(BaseModel):
    items: list[InventoryView]
    total: int
    skip: int
    limit: int


class InventorySummary(BaseModel):
    total_items: int
    total_quantity: int
    low_stock_items: int
    low_stock_threshold: int
    purchase_expenditure: float


class InventoryFilters(BaseModel):
    categories: list[str]
    statuses: list[str]


class InventoryDeleteResponse(BaseModel):
    message: str


class InventoryQuantityUpdate(BaseModel):
    quantity: int

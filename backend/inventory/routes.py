from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.inventory import controller
from backend.middleware.authorization import require_roles
from backend.schemas.inventory import InventoryCreate, InventoryUpdate
from backend.schemas.inventory_views import InventoryDeleteResponse, InventoryFilters, InventoryListResponse, InventoryQuantityUpdate, InventorySummary, InventoryView


router = APIRouter(prefix="/inventory", tags=["inventory"], dependencies=[Depends(require_roles("Admin"))])


@router.get("/summary", response_model=InventorySummary)
def summary(db: Session = Depends(get_db)): return controller.summary(db)


@router.get("/filters", response_model=InventoryFilters)
def filters(db: Session = Depends(get_db)): return controller.filters(db)


@router.get("", response_model=InventoryListResponse)
def items(search: str | None = Query(default=None, max_length=100), category: str | None = Query(default=None, max_length=50), inventory_status: str | None = Query(default=None, max_length=30), low_stock: bool = False, skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    return controller.list_items(db, search=search, category=category, inventory_status=inventory_status, low_stock=low_stock, skip=skip, limit=limit)


@router.get("/{inventory_id}", response_model=InventoryView)
def item(inventory_id: str, db: Session = Depends(get_db)): return controller.get_item(db, inventory_id)


@router.post("", response_model=InventoryView, status_code=status.HTTP_201_CREATED)
def create(request: InventoryCreate, db: Session = Depends(get_db)): return controller.create_item(db, request)


@router.put("/{inventory_id}", response_model=InventoryView)
def update(inventory_id: str, request: InventoryUpdate, db: Session = Depends(get_db)): return controller.update_item(db, inventory_id, request)


@router.patch("/{inventory_id}/quantity", response_model=InventoryView)
def quantity(inventory_id: str, request: InventoryQuantityUpdate, db: Session = Depends(get_db)): return controller.update_quantity(db, inventory_id, request.quantity)


@router.delete("/{inventory_id}", response_model=InventoryDeleteResponse)
def delete(inventory_id: str, db: Session = Depends(get_db)): return controller.delete_item(db, inventory_id)

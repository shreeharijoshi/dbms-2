from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.inventory import service
from backend.schemas.inventory import InventoryCreate, InventoryUpdate


def _database_error(db):
    db.rollback()
    raise HTTPException(status_code=503, detail="Inventory service is temporarily unavailable") from None


def _call(db, operation, *args, **kwargs):
    try:
        return operation(db, *args, **kwargs)
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)


def list_items(db, **filters): return _call(db, service.list_items, **filters)
def summary(db): return _call(db, service.summary)
def filters(db): return _call(db, service.filters)


def get_item(db, inventory_id):
    item = _call(db, service.get_item, inventory_id)
    if item is None: raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def create_item(db, item: InventoryCreate):
    try: return service.create_item(db, item)
    except HTTPException: raise
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="An inventory item with this ID already exists") from None
    except SQLAlchemyError: _database_error(db)


def update_item(db, inventory_id, changes: InventoryUpdate):
    item = _call(db, service.update_item, inventory_id, changes)
    if item is None: raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def update_quantity(db, inventory_id, quantity):
    item = _call(db, service.update_quantity, inventory_id, quantity)
    if item is None: raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def delete_item(db, inventory_id):
    found, reason = _call(db, service.delete_item, inventory_id)
    if not found: raise HTTPException(status_code=404, detail="Inventory item not found")
    if reason: raise HTTPException(status_code=409, detail=reason)
    return {"message": "Inventory item deleted successfully"}

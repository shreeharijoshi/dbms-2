import os

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.inventory import InventoryCreate, InventoryUpdate


def low_stock_threshold() -> int:
    try:
        return max(0, int(os.getenv("INVENTORY_LOW_STOCK_THRESHOLD", "5")))
    except ValueError:
        return 5


INVENTORY_SELECT = """
    SELECT i.inventory_id, i.item_name, i.category, i.quantity, i.cost,
           i.purchase_date, i.inventory_status,
           (SELECT COUNT(*) FROM expenses e WHERE e.inventory_id = i.inventory_id) AS expense_count
    FROM inventory i
"""


def _dict(row):
    return dict(row._mapping) if row else None


def get_item(db: Session, inventory_id: str):
    return _dict(db.execute(text(INVENTORY_SELECT + " WHERE i.inventory_id = :id"), {"id": inventory_id}).first())


def list_items(db: Session, *, search=None, category=None, inventory_status=None, low_stock=False, skip=0, limit=100):
    clauses, params = [], {}
    if search:
        clauses.append("(i.item_name LIKE :search OR i.inventory_id LIKE :search)")
        params["search"] = f"%{search}%"
    if category:
        clauses.append("i.category = :category")
        params["category"] = category
    if inventory_status:
        clauses.append("i.inventory_status = :inventory_status")
        params["inventory_status"] = inventory_status
    if low_stock:
        clauses.append("i.quantity <= :threshold")
        params["threshold"] = low_stock_threshold()
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    joins = " FROM inventory i"
    total = db.execute(text("SELECT COUNT(*)" + joins + where), params).scalar_one()
    params.update(skip=skip, limit=limit)
    rows = db.execute(text(INVENTORY_SELECT + where + " ORDER BY i.item_name, i.inventory_id LIMIT :limit OFFSET :skip"), params).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def summary(db: Session):
    threshold = low_stock_threshold()
    row = db.execute(text("""
        SELECT COUNT(*) AS total_items,
               COALESCE(SUM(quantity), 0) AS total_quantity,
               COALESCE(SUM(CASE WHEN quantity <= :threshold THEN 1 ELSE 0 END), 0) AS low_stock_items,
               COALESCE(SUM(cost * quantity), 0) AS purchase_expenditure
        FROM inventory
    """), {"threshold": threshold}).mappings().one()
    result = dict(row)
    result["low_stock_threshold"] = threshold
    return result


def filters(db: Session):
    categories = db.execute(text("SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL AND category <> '' ORDER BY category")).scalars().all()
    statuses = db.execute(text("SELECT DISTINCT inventory_status FROM inventory WHERE inventory_status IS NOT NULL AND inventory_status <> '' ORDER BY inventory_status")).scalars().all()
    return {"categories": categories, "statuses": statuses}


def create_item(db: Session, request: InventoryCreate):
    data = request.model_dump()
    data["inventory_id"] = data["inventory_id"].strip()
    for key in ("item_name", "category", "inventory_status"):
        data[key] = data[key].strip()
    if not data["inventory_id"] or any(not data[key] for key in ("item_name", "category", "inventory_status")):
        raise HTTPException(status_code=422, detail="Inventory ID, item name, category and status cannot be blank")
    try:
        with db.begin():
            db.execute(text("INSERT INTO inventory (inventory_id, item_name, category, quantity, cost, purchase_date, inventory_status) VALUES (:inventory_id, :item_name, :category, :quantity, :cost, :purchase_date, :inventory_status)"), data)
        return get_item(db, data["inventory_id"])
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An inventory item with this ID already exists") from None


def update_item(db: Session, inventory_id: str, request: InventoryUpdate):
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one field to update")
    for key in ("item_name", "category", "inventory_status"):
        if key in changes:
            if changes[key] is None:
                raise HTTPException(status_code=422, detail=f"{key.replace('_', ' ').capitalize()} cannot be blank")
            changes[key] = changes[key].strip()
            if not changes[key]:
                raise HTTPException(status_code=422, detail=f"{key.replace('_', ' ').capitalize()} cannot be blank")
    try:
        with db.begin():
            exists = db.execute(text("SELECT inventory_id FROM inventory WHERE inventory_id = :id FOR UPDATE"), {"id": inventory_id}).first()
            if not exists:
                return None
            assignments = ", ".join(f"{column} = :{column}" for column in changes)
            changes["id"] = inventory_id
            db.execute(text(f"UPDATE inventory SET {assignments} WHERE inventory_id = :id"), changes)
        return get_item(db, inventory_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Inventory item could not be updated") from None


def update_quantity(db: Session, inventory_id: str, quantity: int):
    if quantity < 0:
        raise HTTPException(status_code=422, detail="Quantity cannot be negative")
    result = db.execute(text("UPDATE inventory SET quantity = :quantity WHERE inventory_id = :id"), {"quantity": quantity, "id": inventory_id})
    db.commit()
    if result.rowcount == 0 and not db.execute(text("SELECT 1 FROM inventory WHERE inventory_id = :id"), {"id": inventory_id}).first():
        return None
    return get_item(db, inventory_id)


def delete_item(db: Session, inventory_id: str):
    try:
        with db.begin():
            found = db.execute(text("SELECT inventory_id FROM inventory WHERE inventory_id = :id FOR UPDATE"), {"id": inventory_id}).first()
            if not found:
                return False, None
            references = db.execute(text("SELECT COUNT(*) FROM expenses WHERE inventory_id = :id"), {"id": inventory_id}).scalar_one()
            if references:
                return True, "This inventory item is referenced by expense history and cannot be deleted."
            db.execute(text("DELETE FROM inventory WHERE inventory_id = :id"), {"id": inventory_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This inventory item is referenced by other records and cannot be deleted."

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.expenses import ExpenseCreate, ExpenseUpdate


EXPENSE_SELECT = """
    SELECT e.expense_id, e.expense_type, e.trainer_id, t.trainer_name,
           e.misc_employee_id, me.employee_name, e.inventory_id, i.item_name,
           e.expense_month, e.amount, e.bonus, e.payment_date, e.payment_mode, e.remarks
    FROM expenses AS e
    LEFT JOIN gym_trainers AS t ON t.employee_id = e.trainer_id
    LEFT JOIN miscellaneous_employees AS me ON me.employee_id = e.misc_employee_id
    LEFT JOIN inventory AS i ON i.inventory_id = e.inventory_id
"""


def _dict(row):
    return dict(row._mapping) if row else None


def get_expense(db: Session, expense_id: str):
    return _dict(db.execute(text(EXPENSE_SELECT + " WHERE e.expense_id = :expense_id"), {"expense_id": expense_id}).first())


def list_expenses(db: Session, *, search=None, expense_type=None, date_from=None, date_to=None, skip=0, limit=100):
    clauses, params = [], {}
    if search:
        clauses.append("(e.expense_id LIKE :search OR e.trainer_id LIKE :search OR t.trainer_name LIKE :search OR e.misc_employee_id LIKE :search OR me.employee_name LIKE :search OR e.inventory_id LIKE :search OR i.item_name LIKE :search)")
        params["search"] = f"%{search}%"
    if expense_type:
        clauses.append("e.expense_type = :expense_type")
        params["expense_type"] = expense_type
    if date_from:
        clauses.append("e.payment_date >= :date_from")
        params["date_from"] = date_from
    if date_to:
        clauses.append("e.payment_date <= :date_to")
        params["date_to"] = date_to
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    joins = " FROM expenses AS e LEFT JOIN gym_trainers AS t ON t.employee_id = e.trainer_id LEFT JOIN miscellaneous_employees AS me ON me.employee_id = e.misc_employee_id LEFT JOIN inventory AS i ON i.inventory_id = e.inventory_id"
    total = db.execute(text("SELECT COUNT(*)" + joins + where), params).scalar_one()
    params.update(skip=skip, limit=limit)
    rows = db.execute(text(EXPENSE_SELECT + where + " ORDER BY e.payment_date DESC, e.expense_id DESC LIMIT :limit OFFSET :skip"), params).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def expense_options(db: Session):
    trainers = db.execute(text("SELECT employee_id, trainer_name FROM gym_trainers ORDER BY trainer_name, employee_id")).all()
    employees = db.execute(text("SELECT employee_id, employee_name FROM miscellaneous_employees ORDER BY employee_name, employee_id")).all()
    inventory = db.execute(text("SELECT inventory_id, item_name FROM inventory ORDER BY item_name, inventory_id")).all()
    return {"trainers": [_dict(row) for row in trainers], "employees": [_dict(row) for row in employees], "inventory": [_dict(row) for row in inventory]}


def _normalize_and_validate(db: Session, data: dict):
    for key in ("trainer_id", "misc_employee_id", "inventory_id"):
        value = data.get(key)
        data[key] = value.strip() if isinstance(value, str) and value.strip() else None
    for key in ("expense_id", "expense_type"):
        if isinstance(data.get(key), str):
            data[key] = data[key].strip()
    if not data.get("expense_id"):
        raise HTTPException(status_code=422, detail="Expense ID cannot be blank")

    trainer_id, employee_id, inventory_id = data.get("trainer_id"), data.get("misc_employee_id"), data.get("inventory_id")
    if data.get("expense_type") == "Salary":
        if bool(trainer_id) == bool(employee_id) or inventory_id:
            raise HTTPException(status_code=422, detail="Salary expenses require exactly one trainer or miscellaneous employee and no inventory item")
        if trainer_id:
            exists = db.execute(text("SELECT 1 FROM gym_trainers WHERE employee_id = :id FOR UPDATE"), {"id": trainer_id}).first()
            if not exists:
                raise HTTPException(status_code=422, detail="Selected trainer does not exist")
        if employee_id:
            exists = db.execute(text("SELECT 1 FROM miscellaneous_employees WHERE employee_id = :id FOR UPDATE"), {"id": employee_id}).first()
            if not exists:
                raise HTTPException(status_code=422, detail="Selected miscellaneous employee does not exist")
    elif data.get("expense_type") == "Maintenance":
        if not inventory_id or trainer_id or employee_id:
            raise HTTPException(status_code=422, detail="Maintenance expenses require one inventory item and no staff references")
        exists = db.execute(text("SELECT 1 FROM inventory WHERE inventory_id = :id FOR UPDATE"), {"id": inventory_id}).first()
        if not exists:
            raise HTTPException(status_code=422, detail="Selected inventory item does not exist")
    else:
        raise HTTPException(status_code=422, detail="Expense type must be Salary or Maintenance")
    return data


def create_expense(db: Session, expense: ExpenseCreate):
    data = expense.model_dump()
    try:
        with db.begin():
            data = _normalize_and_validate(db, data)
            if data.get("expense_month"):
                data["expense_month"] = data["expense_month"].strip() or None
            db.execute(text("""
                INSERT INTO expenses (expense_id, expense_type, trainer_id, misc_employee_id, inventory_id, expense_month, amount, bonus, payment_date, payment_mode, remarks)
                VALUES (:expense_id, :expense_type, :trainer_id, :misc_employee_id, :inventory_id, :expense_month, :amount, :bonus, :payment_date, :payment_mode, :remarks)
            """), data)
        return get_expense(db, data["expense_id"])
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An expense with this ID or a referenced record conflicts with existing data") from None


def update_expense(db: Session, expense_id: str, update: ExpenseUpdate):
    changes = update.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one field to update")
    try:
        with db.begin():
            current = db.execute(text("SELECT expense_id, expense_type, trainer_id, misc_employee_id, inventory_id, expense_month, amount, bonus, payment_date, payment_mode, remarks FROM expenses WHERE expense_id = :id FOR UPDATE"), {"id": expense_id}).mappings().first()
            if not current:
                return None
            data = dict(current)
            data.update(changes)
            data["expense_id"] = expense_id
            data = _normalize_and_validate(db, data)
            if data.get("expense_month"):
                data["expense_month"] = data["expense_month"].strip() or None
            columns = {"expense_type", "trainer_id", "misc_employee_id", "inventory_id", "expense_month", "amount", "bonus", "payment_date", "payment_mode", "remarks"}
            # Update every relationship field together so changing expense type clears stale foreign keys.
            assignments = ", ".join(f"{column} = :{column}" for column in columns)
            db.execute(text(f"UPDATE expenses SET {assignments} WHERE expense_id = :expense_id"), data)
        return get_expense(db, expense_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A referenced record conflicts with existing data") from None


def delete_expense(db: Session, expense_id: str):
    result = db.execute(text("DELETE FROM expenses WHERE expense_id = :id"), {"id": expense_id})
    db.commit()
    return result.rowcount > 0

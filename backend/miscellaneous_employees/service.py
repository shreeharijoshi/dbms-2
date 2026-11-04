from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.miscellaneous_employees import MiscellaneousEmployeeCreate, MiscellaneousEmployeeUpdate


EMPLOYEE_SELECT = """
    SELECT me.employee_id, me.employee_name, me.role,
           (SELECT COUNT(*) FROM expenses e WHERE e.misc_employee_id = me.employee_id) AS expense_count
    FROM miscellaneous_employees me
"""


def _dict(row): return dict(row._mapping) if row else None


def get_employee(db: Session, employee_id: str):
    return _dict(db.execute(text(EMPLOYEE_SELECT + " WHERE me.employee_id = :id"), {"id": employee_id}).first())


def list_employees(db: Session, *, search=None, role=None, skip=0, limit=100):
    clauses, params = [], {}
    if search:
        clauses.append("(me.employee_name LIKE :search OR me.employee_id LIKE :search)")
        params["search"] = f"%{search}%"
    if role:
        clauses.append("me.role = :role")
        params["role"] = role
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    total = db.execute(text("SELECT COUNT(*) FROM miscellaneous_employees me" + where), params).scalar_one()
    params.update(skip=skip, limit=limit)
    rows = db.execute(text(EMPLOYEE_SELECT + where + " ORDER BY me.employee_name, me.employee_id LIMIT :limit OFFSET :skip"), params).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def employee_filters(db: Session):
    roles = db.execute(text("SELECT DISTINCT role FROM miscellaneous_employees WHERE role IS NOT NULL AND role <> '' ORDER BY role")).scalars().all()
    return {"roles": roles}


def create_employee(db: Session, employee: MiscellaneousEmployeeCreate):
    data = employee.model_dump()
    for key in ("employee_id", "employee_name", "role"):
        data[key] = data[key].strip()
        if not data[key]: raise HTTPException(status_code=422, detail=f"{key.replace('_', ' ').capitalize()} cannot be blank")
    try:
        with db.begin():
            db.execute(text("INSERT INTO miscellaneous_employees (employee_id, employee_name, role) VALUES (:employee_id, :employee_name, :role)"), data)
        return get_employee(db, data["employee_id"])
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An employee with this ID already exists") from None


def update_employee(db: Session, employee_id: str, update: MiscellaneousEmployeeUpdate):
    changes = update.model_dump(exclude_unset=True)
    if not changes: raise HTTPException(status_code=422, detail="Provide at least one field to update")
    for key, value in changes.items():
        if value is None or not value.strip(): raise HTTPException(status_code=422, detail=f"{key.replace('_', ' ').capitalize()} cannot be blank")
        changes[key] = value.strip()
    with db.begin():
        found = db.execute(text("SELECT employee_id FROM miscellaneous_employees WHERE employee_id = :id FOR UPDATE"), {"id": employee_id}).first()
        if not found: return None
        assignments = ", ".join(f"{column} = :{column}" for column in changes)
        changes["id"] = employee_id
        db.execute(text(f"UPDATE miscellaneous_employees SET {assignments} WHERE employee_id = :id"), changes)
    return get_employee(db, employee_id)


def delete_employee(db: Session, employee_id: str):
    try:
        with db.begin():
            found = db.execute(text("SELECT employee_id FROM miscellaneous_employees WHERE employee_id = :id FOR UPDATE"), {"id": employee_id}).first()
            if not found: return False, None
            expenses = db.execute(text("SELECT COUNT(*) FROM expenses WHERE misc_employee_id = :id"), {"id": employee_id}).scalar_one()
            if expenses: return True, "This employee is referenced by expense history and cannot be deleted."
            db.execute(text("DELETE FROM miscellaneous_employees WHERE employee_id = :id"), {"id": employee_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This employee is referenced by other records and cannot be deleted."

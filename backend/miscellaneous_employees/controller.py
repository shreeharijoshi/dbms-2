from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.miscellaneous_employees import service
from backend.schemas.miscellaneous_employees import MiscellaneousEmployeeCreate, MiscellaneousEmployeeUpdate


def _database_error(db):
    db.rollback()
    raise HTTPException(status_code=503, detail="Employee service is temporarily unavailable") from None


def _call(db, operation, *args, **kwargs):
    try: return operation(db, *args, **kwargs)
    except HTTPException: raise
    except SQLAlchemyError: _database_error(db)


def list_employees(db, **filters): return _call(db, service.list_employees, **filters)
def employee_filters(db): return _call(db, service.employee_filters)


def get_employee(db, employee_id):
    employee = _call(db, service.get_employee, employee_id)
    if employee is None: raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def create_employee(db, employee: MiscellaneousEmployeeCreate):
    try: return service.create_employee(db, employee)
    except HTTPException: raise
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="An employee with this ID already exists") from None
    except SQLAlchemyError: _database_error(db)


def update_employee(db, employee_id, changes: MiscellaneousEmployeeUpdate):
    employee = _call(db, service.update_employee, employee_id, changes)
    if employee is None: raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def delete_employee(db, employee_id):
    found, reason = _call(db, service.delete_employee, employee_id)
    if not found: raise HTTPException(status_code=404, detail="Employee not found")
    if reason: raise HTTPException(status_code=409, detail=reason)
    return {"message": "Employee deleted successfully"}

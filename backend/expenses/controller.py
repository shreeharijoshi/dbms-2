from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.expenses import service
from backend.schemas.expenses import ExpenseCreate, ExpenseUpdate


def _database_error(db):
    db.rollback()
    raise HTTPException(status_code=503, detail="Expense service is temporarily unavailable") from None


def list_expenses(db, **filters):
    try:
        return service.list_expenses(db, **filters)
    except SQLAlchemyError:
        _database_error(db)


def get_expense(db, expense_id):
    try:
        item = service.get_expense(db, expense_id)
    except SQLAlchemyError:
        _database_error(db)
    if item is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return item


def expense_options(db):
    try:
        return service.expense_options(db)
    except SQLAlchemyError:
        _database_error(db)


def create_expense(db, expense: ExpenseCreate):
    try:
        return service.create_expense(db, expense)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An expense with this ID already exists") from None
    except SQLAlchemyError:
        _database_error(db)


def update_expense(db, expense_id, changes: ExpenseUpdate):
    try:
        item = service.update_expense(db, expense_id, changes)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A referenced record conflicts with existing data") from None
    except SQLAlchemyError:
        _database_error(db)
    if item is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return item


def delete_expense(db, expense_id):
    try:
        if not service.delete_expense(db, expense_id):
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except SQLAlchemyError:
        _database_error(db)

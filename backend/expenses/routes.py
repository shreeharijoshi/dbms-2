from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.expenses import controller
from backend.schemas.expense_views import ExpenseDeleteResponse, ExpenseListResponse, ExpenseOptionsResponse, ExpenseView
from backend.schemas.expenses import ExpenseCreate, ExpenseUpdate


router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/options", response_model=ExpenseOptionsResponse)
def options(db: Session = Depends(get_db)):
    return controller.expense_options(db)


@router.get("", response_model=ExpenseListResponse)
def expenses(search: str | None = Query(default=None, max_length=100), expense_type: str | None = Query(default=None, max_length=20), date_from: date | None = None, date_to: date | None = None, skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    if date_from and date_to and date_from > date_to:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Start date must be on or before end date")
    return controller.list_expenses(db, search=search, expense_type=expense_type, date_from=date_from, date_to=date_to, skip=skip, limit=limit)


@router.get("/{expense_id}", response_model=ExpenseView)
def expense(expense_id: str, db: Session = Depends(get_db)):
    return controller.get_expense(db, expense_id)


@router.post("", response_model=ExpenseView, status_code=status.HTTP_201_CREATED)
def create(expense: ExpenseCreate, db: Session = Depends(get_db)):
    return controller.create_expense(db, expense)


@router.put("/{expense_id}", response_model=ExpenseView)
def update(expense_id: str, changes: ExpenseUpdate, db: Session = Depends(get_db)):
    return controller.update_expense(db, expense_id, changes)


@router.delete("/{expense_id}", response_model=ExpenseDeleteResponse)
def delete(expense_id: str, db: Session = Depends(get_db)):
    return controller.delete_expense(db, expense_id)

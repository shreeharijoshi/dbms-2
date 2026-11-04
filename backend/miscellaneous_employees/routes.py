from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.miscellaneous_employees import controller
from backend.schemas.miscellaneous_employee_views import EmployeeDeleteResponse, EmployeeFilters, MiscellaneousEmployeeListResponse, MiscellaneousEmployeeView
from backend.schemas.miscellaneous_employees import MiscellaneousEmployeeCreate, MiscellaneousEmployeeUpdate


router = APIRouter(prefix="/miscellaneous-employees", tags=["miscellaneous employees"])


@router.get("/filters", response_model=EmployeeFilters)
def filters(db: Session = Depends(get_db)): return controller.employee_filters(db)


@router.get("", response_model=MiscellaneousEmployeeListResponse)
def employees(search: str | None = Query(default=None, max_length=100), role: str | None = Query(default=None, max_length=50), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=200), db: Session = Depends(get_db)):
    return controller.list_employees(db, search=search, role=role, skip=skip, limit=limit)


@router.get("/{employee_id}", response_model=MiscellaneousEmployeeView)
def employee(employee_id: str, db: Session = Depends(get_db)): return controller.get_employee(db, employee_id)


@router.post("", response_model=MiscellaneousEmployeeView, status_code=status.HTTP_201_CREATED)
def create(request: MiscellaneousEmployeeCreate, db: Session = Depends(get_db)): return controller.create_employee(db, request)


@router.put("/{employee_id}", response_model=MiscellaneousEmployeeView)
def update(employee_id: str, request: MiscellaneousEmployeeUpdate, db: Session = Depends(get_db)): return controller.update_employee(db, employee_id, request)


@router.delete("/{employee_id}", response_model=EmployeeDeleteResponse)
def delete(employee_id: str, db: Session = Depends(get_db)): return controller.delete_employee(db, employee_id)

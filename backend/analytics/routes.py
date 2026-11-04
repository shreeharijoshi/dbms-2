from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.analytics import service
from backend.database.connection import get_db
from backend.middleware.authorization import require_roles

router = APIRouter(
    prefix="/admin/analytics",
    tags=["admin analytics"],
    dependencies=[Depends(require_roles("Admin"))],
)


@router.get("/dashboard")
def dashboard(months: int = Query(default=12, ge=1, le=36), db: Session = Depends(get_db)):
    return service.dashboard(db, months)


@router.get("/reports/{report_type}")
def report(
    report_type: str,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="Start date must be on or before end date")
    try:
        return service.report(db, report_type, date_from, date_to)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown report type") from None

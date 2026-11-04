from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.payments import PaymentCreate


PAYMENT_SELECT = """
    SELECT p.payment_id, p.member_id, m.member_name, p.plan_id,
           p.amount, p.payment_date, p.payment_mode
    FROM payments AS p
    LEFT JOIN members AS m ON m.member_id = p.member_id
"""


def _dict(row):
    return dict(row._mapping) if row else None


def get_payment(db: Session, payment_id: str):
    return _dict(db.execute(text(PAYMENT_SELECT + " WHERE p.payment_id = :payment_id"), {"payment_id": payment_id}).first())


def list_payments(db: Session, *, search=None, date_from=None, date_to=None, payment_mode=None, member_id=None, skip=0, limit=100):
    clauses, params = [], {}
    if member_id:
        exists = db.execute(text("SELECT 1 FROM members WHERE member_id = :member_id"), {"member_id": member_id}).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Member not found")
    if search:
        clauses.append("(p.payment_id LIKE :search OR p.member_id LIKE :search OR m.member_name LIKE :search)")
        params["search"] = f"%{search}%"
    if date_from:
        clauses.append("p.payment_date >= :date_from")
        params["date_from"] = date_from
    if date_to:
        clauses.append("p.payment_date <= :date_to")
        params["date_to"] = date_to
    if payment_mode:
        clauses.append("p.payment_mode = :payment_mode")
        params["payment_mode"] = payment_mode
    if member_id:
        clauses.append("p.member_id = :member_id")
        params["member_id"] = member_id
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    joins = " FROM payments AS p LEFT JOIN members AS m ON m.member_id = p.member_id"
    total = db.execute(text("SELECT COUNT(*)" + joins + where), params).scalar_one()
    params.update(skip=skip, limit=limit)
    rows = db.execute(text(PAYMENT_SELECT + where + " ORDER BY p.payment_date DESC, p.payment_id DESC LIMIT :limit OFFSET :skip"), params).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def payment_options(db: Session):
    members = db.execute(text("SELECT member_id, member_name FROM members ORDER BY member_name, member_id")).all()
    plans = db.execute(text("SELECT plan_id FROM membership_plans ORDER BY plan_id")).all()
    return {"members": [_dict(row) for row in members], "plans": [_dict(row) for row in plans]}


def create_payment(db: Session, payment: PaymentCreate):
    data = payment.model_dump()
    data["payment_id"] = data["payment_id"].strip()
    data["member_id"] = data["member_id"].strip()
    data["plan_id"] = data["plan_id"].strip()
    if not all(data[key] for key in ("payment_id", "member_id", "plan_id")):
        raise HTTPException(status_code=422, detail="Payment ID, member, and plan are required")
    try:
        with db.begin():
            member = db.execute(text("SELECT member_id FROM members WHERE member_id = :id FOR UPDATE"), {"id": data["member_id"]}).first()
            plan = db.execute(text("SELECT plan_id FROM membership_plans WHERE plan_id = :id FOR UPDATE"), {"id": data["plan_id"]}).first()
            if not member:
                raise HTTPException(status_code=422, detail="Selected member does not exist")
            if not plan:
                raise HTTPException(status_code=422, detail="Selected plan does not exist")
            db.execute(text("INSERT INTO payments (payment_id, member_id, plan_id, amount, payment_date, payment_mode) VALUES (:payment_id, :member_id, :plan_id, :amount, :payment_date, :payment_mode)"), data)
        return get_payment(db, data["payment_id"])
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A payment with this ID or referenced records already exist") from None

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.schemas.member_portal import MemberContactUpdate


PROFILE_SELECT = """
    SELECT member_id, member_name, gender, dob, contact, height, weight, bmi
    FROM members
"""

MEMBERSHIP_SELECT = """
    SELECT mp.membership_id, mp.plan_id, p.duration, p.price,
           mp.start_date, mp.end_date,
           CASE
             WHEN mp.membership_status = 'Active' AND mp.end_date < CURRENT_DATE THEN 'Expired'
             WHEN mp.membership_status = 'Active' AND mp.start_date > CURRENT_DATE THEN 'Upcoming'
             ELSE COALESCE(mp.membership_status, 'Unknown')
           END AS membership_status,
           CASE WHEN mp.membership_status = 'Active'
                     AND (mp.start_date IS NULL OR mp.start_date <= CURRENT_DATE)
                     AND (mp.end_date IS NULL OR mp.end_date >= CURRENT_DATE)
                THEN 1 ELSE 0 END AS is_current
    FROM members_plans mp
    LEFT JOIN membership_plans p ON p.plan_id = mp.plan_id
"""


def _dict(row):
    return dict(row._mapping) if row else None


def _member_id(member_id: str):
    member_id = member_id.strip()
    if not member_id:
        raise HTTPException(status_code=422, detail="Select a member record")
    return member_id


def profile(db: Session, member_id: str):
    row = db.execute(text(PROFILE_SELECT + " WHERE member_id = :member_id"), {"member_id": _member_id(member_id)}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Member profile not found")
    return _dict(row)


def update_contact(db: Session, member_id: str, request: MemberContactUpdate):
    member_id = _member_id(member_id)
    with db.begin():
        row = db.execute(text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"), {"member_id": member_id}).first()
        if not row:
            raise HTTPException(status_code=404, detail="Member profile not found")
        db.execute(text("UPDATE members SET contact = :contact WHERE member_id = :member_id"), {"contact": request.contact, "member_id": member_id})
    return profile(db, member_id)


def memberships(db: Session, member_id: str):
    member_id = _member_id(member_id)
    rows = db.execute(text(MEMBERSHIP_SELECT + " WHERE mp.member_id = :member_id ORDER BY mp.start_date DESC, mp.membership_id DESC"), {"member_id": member_id}).all()
    history = [_dict(row) for row in rows]
    current = next((item for item in history if item["is_current"]), history[0] if history else None)
    current_id = current["membership_id"] if current else None
    for item in history:
        item.pop("is_current", None)
    current = next((item for item in history if item["membership_id"] == current_id), None) if current_id else None
    plans = db.execute(text("SELECT plan_id, duration, price, group_discount, seasonal_discount FROM membership_plans ORDER BY duration, plan_id")).all()
    return {"current": current, "history": history, "available_plans": [_dict(row) for row in plans]}


def payment_list(db: Session, member_id: str, skip=0, limit=100):
    member_id = _member_id(member_id)
    total = db.execute(text("SELECT COUNT(*) FROM payments WHERE member_id = :member_id"), {"member_id": member_id}).scalar_one()
    rows = db.execute(text("SELECT p.payment_id, p.member_id, m.member_name, p.plan_id, p.amount, p.payment_date, p.payment_mode FROM payments p LEFT JOIN members m ON m.member_id = p.member_id WHERE p.member_id = :member_id ORDER BY p.payment_date DESC, p.payment_id DESC LIMIT :limit OFFSET :skip"), {"member_id": member_id, "skip": skip, "limit": limit}).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def payment_detail(db: Session, member_id: str, payment_id: str):
    row = db.execute(text("SELECT p.payment_id, p.member_id, m.member_name, p.plan_id, p.amount, p.payment_date, p.payment_mode FROM payments p LEFT JOIN members m ON m.member_id = p.member_id WHERE p.payment_id = :payment_id AND p.member_id = :member_id"), {"payment_id": payment_id, "member_id": _member_id(member_id)}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _dict(row)


def trainer(db: Session, member_id: str):
    row = db.execute(text("""
        SELECT t.employee_id, t.trainer_name, t.speciality, t.qualification, t.shift
        FROM members m JOIN gym_trainers t ON t.employee_id = m.PT
        WHERE m.member_id = :member_id
    """), {"member_id": _member_id(member_id)}).first()
    return _dict(row)


def overview(db: Session, member_id: str):
    member_id = _member_id(member_id)
    profile_data = profile(db, member_id)
    membership_rows = db.execute(text(MEMBERSHIP_SELECT + " WHERE mp.member_id = :member_id ORDER BY mp.start_date DESC, mp.membership_id DESC"), {"member_id": member_id}).mappings().all()
    current = next((dict(row) for row in membership_rows if row["is_current"]), dict(membership_rows[0]) if membership_rows else None)
    if current:
        current.pop("is_current", None)
    days_remaining = None
    if current and current["membership_status"] == "Expired":
        days_remaining = 0
    elif current and current["membership_status"] == "Active" and current["end_date"] is not None:
        today = db.execute(text("SELECT CURRENT_DATE")).scalar_one()
        days_remaining = max(0, (current["end_date"] - today).days)
    assigned_trainer = trainer(db, member_id)
    payment = db.execute(text("SELECT p.payment_id, p.member_id, m.member_name, p.plan_id, p.amount, p.payment_date, p.payment_mode FROM payments p LEFT JOIN members m ON m.member_id = p.member_id WHERE p.member_id = :member_id ORDER BY p.payment_date DESC, p.payment_id DESC LIMIT 1"), {"member_id": member_id}).first()
    return {"profile": profile_data, "membership": current, "days_remaining": days_remaining, "trainer": assigned_trainer, "latest_payment": _dict(payment)}


def options(db: Session):
    rows = db.execute(text("SELECT member_id, member_name FROM members ORDER BY member_name, member_id")).mappings().all()
    return [dict(row) for row in rows]

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.membership_plans import MembershipPlanCreate, MembershipPlanUpdate


PLAN_SELECT = """
    SELECT p.plan_id, p.duration, p.price, p.group_discount, p.seasonal_discount,
           (SELECT COUNT(*) FROM members_plans AS mp WHERE mp.plan_id = p.plan_id) AS subscription_count
    FROM membership_plans AS p
"""


def _as_dict(row):
    return dict(row._mapping) if row else None


def list_plans(db: Session, search, duration, skip, limit):
    conditions = []
    params = {}
    if search:
        conditions.append("p.plan_id LIKE :search")
        params["search"] = f"%{search}%"
    if duration is not None:
        conditions.append("p.duration = :duration")
        params["duration"] = duration
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    total = db.execute(text("SELECT COUNT(*) FROM membership_plans AS p" + where), params).scalar_one()
    params.update({"skip": skip, "limit": limit})
    rows = db.execute(
        text(PLAN_SELECT + where + " ORDER BY p.duration, p.plan_id LIMIT :limit OFFSET :skip"),
        params,
    ).all()
    return {"items": [_as_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def get_plan(db: Session, plan_id: str):
    row = db.execute(text(PLAN_SELECT + " WHERE p.plan_id = :plan_id"), {"plan_id": plan_id}).first()
    return _as_dict(row)


def get_plan_filters(db: Session):
    durations = db.execute(
        text("SELECT DISTINCT duration FROM membership_plans WHERE duration IS NOT NULL ORDER BY duration")
    ).scalars().all()
    return {"durations": durations}


def create_plan(db: Session, plan: MembershipPlanCreate):
    data = plan.model_dump()
    data["plan_id"] = data["plan_id"].strip()
    if not data["plan_id"]:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Plan ID cannot be blank")
    db.execute(
        text("""
            INSERT INTO membership_plans (plan_id, duration, price, group_discount, seasonal_discount)
            VALUES (:plan_id, :duration, :price, :group_discount, :seasonal_discount)
        """),
        data,
    )
    db.commit()
    return get_plan(db, data["plan_id"])


def update_plan(db: Session, plan_id: str, changes: MembershipPlanUpdate):
    data = changes.model_dump(exclude_unset=True)
    if not data:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Provide at least one field to update")
    exists = db.execute(text("SELECT 1 FROM membership_plans WHERE plan_id = :plan_id"), {"plan_id": plan_id}).first()
    if not exists:
        return None
    allowed_columns = {"duration", "price", "group_discount", "seasonal_discount"}
    assignments = ", ".join(f"{column} = :{column}" for column in data if column in allowed_columns)
    data["plan_id"] = plan_id
    db.execute(text(f"UPDATE membership_plans SET {assignments} WHERE plan_id = :plan_id"), data)
    db.commit()
    return get_plan(db, plan_id)


def delete_plan(db: Session, plan_id: str):
    try:
        with db.begin():
            found = db.execute(
                text("SELECT plan_id FROM membership_plans WHERE plan_id = :plan_id FOR UPDATE"),
                {"plan_id": plan_id},
            ).first()
            if not found:
                return False, None
            subscriptions = db.execute(
                text("SELECT COUNT(*) FROM members_plans WHERE plan_id = :plan_id"),
                {"plan_id": plan_id},
            ).scalar_one()
            payments = db.execute(
                text("SELECT COUNT(*) FROM payments WHERE plan_id = :plan_id"),
                {"plan_id": plan_id},
            ).scalar_one()
            if subscriptions or payments:
                return True, "This plan is referenced by subscription or payment history and cannot be deleted."
            db.execute(text("DELETE FROM membership_plans WHERE plan_id = :plan_id"), {"plan_id": plan_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This plan is referenced by other records and cannot be deleted."

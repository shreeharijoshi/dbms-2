from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.members import MemberCreate, MemberUpdate


MEMBER_SELECT = """
    SELECT m.member_id, m.member_name, m.gender, m.contact, m.dob,
           m.height, m.weight, m.bmi, m.PT AS trainer_id,
           t.trainer_name,
           CASE WHEN EXISTS (
             SELECT 1 FROM members_plans AS active_membership
             WHERE active_membership.member_id = m.member_id
               AND LOWER(active_membership.membership_status) = 'active'
               AND (active_membership.start_date IS NULL OR active_membership.start_date <= CURRENT_DATE)
               AND (active_membership.end_date IS NULL OR active_membership.end_date >= CURRENT_DATE)
           ) THEN 'Active' ELSE 'Inactive' END AS member_status
    FROM members AS m
    LEFT JOIN gym_trainers AS t ON t.employee_id = m.PT
"""


def _row_dict(row):
    return dict(row._mapping) if row else None


def get_member(db: Session, member_id: str):
    row = db.execute(
        text(MEMBER_SELECT + " WHERE m.member_id = :member_id"),
        {"member_id": member_id},
    ).first()
    return _row_dict(row)


def list_members(
    db: Session,
    search: str | None,
    gender: str | None,
    trainer_id: str | None,
    skip: int,
    limit: int,
):
    conditions = []
    params = {}
    if search:
        conditions.append("(m.member_name LIKE :search OR m.member_id LIKE :search)")
        params["search"] = f"%{search}%"
    if gender:
        conditions.append("m.gender = :gender")
        params["gender"] = gender
    if trainer_id:
        conditions.append("m.PT = :trainer_id")
        params["trainer_id"] = trainer_id
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    total = db.execute(text("SELECT COUNT(*) FROM members AS m" + where), params).scalar_one()
    params.update({"skip": skip, "limit": limit})
    rows = db.execute(
        text(MEMBER_SELECT + where + " ORDER BY m.member_name, m.member_id LIMIT :limit OFFSET :skip"),
        params,
    ).all()
    return {"items": [_row_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def list_trainers(db: Session):
    rows = db.execute(
        text("SELECT employee_id, trainer_name FROM gym_trainers ORDER BY trainer_name, employee_id")
    ).all()
    return [dict(row._mapping) for row in rows]


def ensure_trainer_exists(db: Session, trainer_id: str | None):
    if trainer_id is None:
        return
    exists = db.execute(
        text("SELECT 1 FROM gym_trainers WHERE employee_id = :trainer_id"),
        {"trainer_id": trainer_id},
    ).first()
    if not exists:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Assigned trainer does not exist")


def create_member(db: Session, member: MemberCreate):
    data = member.model_dump()
    ensure_trainer_exists(db, data["PT"])
    db.execute(
        text("""
            INSERT INTO members (member_id, member_name, gender, height, weight, contact, dob, PT, member_status)
            VALUES (:member_id, :member_name, :gender, :height, :weight, :contact, :dob, :PT, 'Inactive')
        """),
        data,
    )
    db.commit()
    return get_member(db, data["member_id"])


def update_member(db: Session, member_id: str, changes: MemberUpdate):
    data = changes.model_dump(exclude_unset=True)
    if not data:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Provide at least one field to update")
    ensure_trainer_exists(db, data.get("PT"))
    exists = db.execute(
        text("SELECT 1 FROM members WHERE member_id = :member_id"),
        {"member_id": member_id},
    ).first()
    if not exists:
        return None
    columns = {"member_name", "gender", "height", "weight", "contact", "dob", "PT"}
    assignments = ", ".join(f"{column} = :{column}" for column in data if column in columns)
    data["member_id"] = member_id
    result = db.execute(
        text(f"UPDATE members SET {assignments} WHERE member_id = :member_id"), data
    )
    db.commit()
    return get_member(db, member_id)


def delete_member(db: Session, member_id: str):
    """Delete only unreferenced members; retain memberships/payment history."""
    try:
        with db.begin():
            found = db.execute(
                text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"),
                {"member_id": member_id},
            ).first()
            if not found:
                return False, None
            memberships = db.execute(
                text("SELECT COUNT(*) FROM members_plans WHERE member_id = :member_id"),
                {"member_id": member_id},
            ).scalar_one()
            payments = db.execute(
                text("SELECT COUNT(*) FROM payments WHERE member_id = :member_id"),
                {"member_id": member_id},
            ).scalar_one()
            if memberships or payments:
                return True, "This member has membership or payment records and cannot be deleted."
            db.execute(text("DELETE FROM members WHERE member_id = :member_id"), {"member_id": member_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This member is referenced by other records and cannot be deleted."

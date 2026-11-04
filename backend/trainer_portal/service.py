from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


MEMBER_SELECT = """
    SELECT m.member_id, m.member_name, m.gender, m.contact, m.dob,
           m.height, m.weight, m.bmi, m.member_status,
           mp.membership_id, mp.plan_id,
           mp.start_date AS membership_start_date,
           mp.end_date AS membership_end_date,
           CASE
             WHEN mp.membership_status = 'Active' AND mp.end_date < CURRENT_DATE THEN 'Expired'
             ELSE mp.membership_status
           END AS membership_status
    FROM members AS m
    LEFT JOIN members_plans AS mp ON mp.membership_id = (
        SELECT membership_candidate.membership_id
        FROM members_plans AS membership_candidate
        WHERE membership_candidate.member_id = m.member_id
        ORDER BY (
            membership_candidate.membership_status = 'Active'
            AND (membership_candidate.start_date IS NULL OR membership_candidate.start_date <= CURRENT_DATE)
            AND (membership_candidate.end_date IS NULL OR membership_candidate.end_date >= CURRENT_DATE)
        ) DESC, membership_candidate.start_date DESC, membership_candidate.membership_id DESC
        LIMIT 1
    )
"""


def _dict(row):
    return dict(row._mapping) if row else None


def _trainer_id(trainer_id: str):
    trainer_id = trainer_id.strip()
    if not trainer_id:
        raise HTTPException(status_code=422, detail="Select a trainer record")
    return trainer_id


def _profile(db: Session, employee_id: str):
    row = db.execute(text("""
        SELECT employee_id, trainer_name, dob, gender, height, weight,
               speciality, qualification, shift
        FROM gym_trainers WHERE employee_id = :employee_id
    """), {"employee_id": employee_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Trainer profile not found")
    return _dict(row)


def _list_members(db: Session, trainer_id: str, *, search=None, skip=0, limit=100):
    clauses = ["m.PT = :trainer_id"]
    params = {"trainer_id": trainer_id}
    if search:
        clauses.append("(m.member_name LIKE :search OR m.member_id LIKE :search)")
        params["search"] = f"%{search}%"
    where = " WHERE " + " AND ".join(clauses)
    total = db.execute(text("SELECT COUNT(*) FROM members m" + where), params).scalar_one()
    params.update(skip=skip, limit=limit)
    rows = db.execute(text(MEMBER_SELECT + where + " ORDER BY m.member_name, m.member_id LIMIT :limit OFFSET :skip"), params).all()
    return {"items": [_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def overview(db: Session, trainer_id: str):
    trainer_id = _trainer_id(trainer_id)
    trainer = _profile(db, trainer_id)
    member_result = _list_members(db, trainer_id, limit=5)
    return {"trainer": trainer, "assigned_member_count": member_result["total"], "members": member_result["items"]}


def list_members(db: Session, trainer_id: str, search, skip, limit):
    trainer_id = _trainer_id(trainer_id)
    _profile(db, trainer_id)
    return _list_members(db, trainer_id, search=search, skip=skip, limit=limit)


def get_member(db: Session, trainer_id: str, member_id: str):
    trainer_id = _trainer_id(trainer_id)
    row = db.execute(text(MEMBER_SELECT + " WHERE m.member_id = :member_id AND m.PT = :trainer_id"), {"member_id": member_id, "trainer_id": trainer_id}).first()
    if not row:
        # Do not reveal whether a different trainer's member ID exists.
        raise HTTPException(status_code=404, detail="Assigned member not found")
    return _dict(row)


def profile(db: Session, trainer_id: str):
    return _profile(db, _trainer_id(trainer_id))


def options(db: Session):
    rows = db.execute(text("SELECT employee_id, trainer_name FROM gym_trainers ORDER BY trainer_name, employee_id")).mappings().all()
    return [dict(row) for row in rows]

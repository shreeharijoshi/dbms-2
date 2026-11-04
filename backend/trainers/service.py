from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import date

from backend.schemas.gym_trainers import GymTrainerCreate, GymTrainerUpdate


TRAINER_SELECT = """
    SELECT t.employee_id, t.trainer_name, t.dob, t.gender, t.height, t.weight,
           t.speciality, t.qualification, t.shift,
           (SELECT COUNT(*) FROM members AS m WHERE m.PT = t.employee_id) AS assigned_member_count
    FROM gym_trainers AS t
"""


def _as_dict(row):
    return dict(row._mapping) if row else None


def list_trainers(db: Session, search, speciality, shift, skip, limit):
    conditions = []
    params = {}
    if search:
        conditions.append("(t.trainer_name LIKE :search OR t.employee_id LIKE :search)")
        params["search"] = f"%{search}%"
    if speciality:
        conditions.append("t.speciality = :speciality")
        params["speciality"] = speciality
    if shift:
        conditions.append("t.shift = :shift")
        params["shift"] = shift
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    total = db.execute(text("SELECT COUNT(*) FROM gym_trainers AS t" + where), params).scalar_one()
    params.update({"skip": skip, "limit": limit})
    rows = db.execute(
        text(TRAINER_SELECT + where + " ORDER BY t.trainer_name, t.employee_id LIMIT :limit OFFSET :skip"),
        params,
    ).all()
    return {"items": [_as_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def get_trainer(db: Session, employee_id: str):
    row = db.execute(
        text(TRAINER_SELECT + " WHERE t.employee_id = :employee_id"),
        {"employee_id": employee_id},
    ).first()
    return _as_dict(row)


def list_filter_options(db: Session):
    specialities = db.execute(
        text("SELECT DISTINCT speciality FROM gym_trainers WHERE speciality IS NOT NULL AND speciality <> '' ORDER BY speciality")
    ).scalars().all()
    shifts = db.execute(
        text("SELECT DISTINCT shift FROM gym_trainers WHERE shift IS NOT NULL AND shift <> '' ORDER BY shift")
    ).scalars().all()
    return {"specialities": specialities, "shifts": shifts}


def list_assigned_members(db: Session, employee_id: str):
    rows = db.execute(
        text("""
            SELECT member_id, member_name, gender, contact, member_status
            FROM members WHERE PT = :employee_id
            ORDER BY member_name, member_id
        """),
        {"employee_id": employee_id},
    ).all()
    return [_as_dict(row) for row in rows]


def create_trainer(db: Session, trainer: GymTrainerCreate):
    data = trainer.model_dump()
    data = _clean_and_validate(data, required=True)
    db.execute(
        text("""
            INSERT INTO gym_trainers
                (employee_id, trainer_name, dob, gender, height, weight, speciality, qualification, shift)
            VALUES
                (:employee_id, :trainer_name, :dob, :gender, :height, :weight, :speciality, :qualification, :shift)
        """),
        data,
    )
    db.commit()
    return get_trainer(db, data["employee_id"])


def update_trainer(db: Session, employee_id: str, changes: GymTrainerUpdate):
    data = changes.model_dump(exclude_unset=True)
    if not data:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Provide at least one field to update")
    data = _clean_and_validate(data, required=False)
    exists = db.execute(
        text("SELECT 1 FROM gym_trainers WHERE employee_id = :employee_id"),
        {"employee_id": employee_id},
    ).first()
    if not exists:
        return None
    allowed_columns = {"trainer_name", "dob", "gender", "height", "weight", "speciality", "qualification", "shift"}
    assignments = ", ".join(f"{column} = :{column}" for column in data if column in allowed_columns)
    data["employee_id"] = employee_id
    db.execute(text(f"UPDATE gym_trainers SET {assignments} WHERE employee_id = :employee_id"), data)
    db.commit()
    return get_trainer(db, employee_id)


def _clean_and_validate(data: dict, *, required: bool) -> dict:
    from fastapi import HTTPException

    for field in ("employee_id", "trainer_name", "gender", "speciality", "qualification", "shift"):
        value = data.get(field)
        if value is None:
            if required:
                raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} is required")
            continue
        cleaned = value.strip()
        if not cleaned:
            raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} cannot be blank")
        data[field] = cleaned
    if data.get("dob") is not None and data["dob"] > date.today():
        raise HTTPException(status_code=422, detail="Date of birth cannot be in the future")
    return data


def delete_trainer(db: Session, employee_id: str):
    """Prevent deletion while records still depend on the trainer."""
    try:
        with db.begin():
            found = db.execute(
                text("SELECT employee_id FROM gym_trainers WHERE employee_id = :employee_id FOR UPDATE"),
                {"employee_id": employee_id},
            ).first()
            if not found:
                return False, None
            members = db.execute(
                text("SELECT COUNT(*) FROM members WHERE PT = :employee_id"),
                {"employee_id": employee_id},
            ).scalar_one()
            expenses = db.execute(
                text("SELECT COUNT(*) FROM expenses WHERE trainer_id = :employee_id"),
                {"employee_id": employee_id},
            ).scalar_one()
            accounts = db.execute(
                text("SELECT COUNT(*) FROM auth_accounts WHERE trainer_employee_id = :employee_id"),
                {"employee_id": employee_id},
            ).scalar_one()
            if members or expenses or accounts:
                reasons = []
                if members:
                    reasons.append("assigned members")
                if expenses:
                    reasons.append("expense records")
                if accounts:
                    reasons.append("a trainer login account")
                return True, "This trainer still has " + ", ".join(reasons) + " and cannot be deleted."
            db.execute(text("DELETE FROM gym_trainers WHERE employee_id = :employee_id"), {"employee_id": employee_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This trainer is referenced by other records and cannot be deleted."

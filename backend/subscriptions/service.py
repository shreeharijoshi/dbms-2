import secrets
from calendar import monthrange
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.schemas.membership_views import SubscriptionStatusUpdate
from backend.schemas.subscription_requests import SubscriptionEnrollRequest, SubscriptionRenewRequest


SUBSCRIPTION_SELECT = """
    SELECT mp.membership_id, mp.member_id, m.member_name,
           mp.plan_id, p.duration, p.price AS plan_price,
           p.group_discount, p.seasonal_discount,
           mp.start_date, mp.end_date,
           CASE
             WHEN mp.membership_status = 'Active' AND mp.end_date < CURRENT_DATE THEN 'Expired'
             ELSE COALESCE(mp.membership_status, 'Unknown')
           END AS membership_status
    FROM members_plans AS mp
    LEFT JOIN members AS m ON m.member_id = mp.member_id
    LEFT JOIN membership_plans AS p ON p.plan_id = mp.plan_id
"""


def _as_dict(row):
    return dict(row._mapping) if row else None


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    if year > 9999:
        raise HTTPException(status_code=422, detail="Plan duration exceeds the supported date range")
    month = month_index % 12 + 1
    day = min(start.day, monthrange(year, month)[1])
    return date(year, month, day)


def _end_date(start: date, duration_months: int) -> date:
    # Existing records use an inclusive end date: a one-month plan starting
    # Aug 1 ends Aug 31, and a six-month plan starting Apr 15 ends Oct 14.
    return _add_months(start, duration_months) - timedelta(days=1)


def _find_overlapping_active(db: Session, member_id: str, start: date, end: date, exclude_id=None):
    return db.execute(
        text("""
            SELECT membership_id
            FROM members_plans
            WHERE member_id = :member_id
              AND membership_status = 'Active'
              AND (start_date IS NULL OR start_date <= :end_date)
              AND (end_date IS NULL OR end_date >= :start_date)
              AND (:exclude_id IS NULL OR membership_id <> :exclude_id)
            LIMIT 1 FOR UPDATE
        """),
        {"member_id": member_id, "start_date": start, "end_date": end, "exclude_id": exclude_id},
    ).first()


def _get_duration(db: Session, plan_id: str):
    duration = db.execute(
        text("SELECT duration FROM membership_plans WHERE plan_id = :plan_id FOR UPDATE"),
        {"plan_id": plan_id},
    ).scalar_one_or_none()
    if duration is None or int(duration) <= 0:
        raise HTTPException(status_code=404, detail="Membership plan not found or has no duration")
    return int(duration)


def _new_membership_id(db: Session):
    # The existing primary key is a manually assigned VARCHAR(20).
    for _ in range(5):
        membership_id = "MSH" + secrets.token_hex(8).upper()
        exists = db.execute(
            text("SELECT 1 FROM members_plans WHERE membership_id = :membership_id"),
            {"membership_id": membership_id},
        ).first()
        if not exists:
            return membership_id
    raise HTTPException(status_code=503, detail="Could not allocate a membership ID")


def _list_subscriptions(db: Session, *, search=None, status=None, member_id=None, expiring=False, skip=0, limit=100):
    conditions = []
    params = {}
    if search:
        conditions.append("(mp.membership_id LIKE :search OR mp.member_id LIKE :search OR m.member_name LIKE :search OR mp.plan_id LIKE :search)")
        params["search"] = f"%{search}%"
    if status:
        conditions.append("(CASE WHEN mp.membership_status = 'Active' AND mp.end_date < CURRENT_DATE THEN 'Expired' ELSE COALESCE(mp.membership_status, 'Unknown') END) = :status")
        params["status"] = status
    if member_id:
        conditions.append("mp.member_id = :member_id")
        params["member_id"] = member_id
    if expiring:
        conditions.append("mp.membership_status = 'Active' AND (mp.start_date IS NULL OR mp.start_date <= CURRENT_DATE) AND mp.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)")
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    joins = " FROM members_plans AS mp LEFT JOIN members AS m ON m.member_id = mp.member_id LEFT JOIN membership_plans AS p ON p.plan_id = mp.plan_id"
    total = db.execute(text("SELECT COUNT(*)" + joins + where), params).scalar_one()
    params.update({"skip": skip, "limit": limit})
    rows = db.execute(
        text(SUBSCRIPTION_SELECT + where + " ORDER BY mp.start_date DESC, mp.membership_id DESC LIMIT :limit OFFSET :skip"),
        params,
    ).all()
    return {"items": [_as_dict(row) for row in rows], "total": total, "skip": skip, "limit": limit}


def list_subscriptions(db: Session, search, status, skip, limit):
    return _list_subscriptions(db, search=search, status=status, skip=skip, limit=limit)


def list_member_subscriptions(db: Session, member_id: str, search, skip, limit):
    found = db.execute(text("SELECT 1 FROM members WHERE member_id = :member_id"), {"member_id": member_id}).first()
    if not found:
        raise HTTPException(status_code=404, detail="Member not found")
    return _list_subscriptions(db, member_id=member_id, search=search, skip=skip, limit=limit)


def list_expiring_subscriptions(db: Session, search, skip, limit):
    return _list_subscriptions(db, search=search, expiring=True, skip=skip, limit=limit)


def get_subscription_options(db: Session):
    members = db.execute(text("SELECT member_id, member_name FROM members ORDER BY member_name, member_id")).all()
    plans = db.execute(text("SELECT plan_id, duration, price FROM membership_plans ORDER BY duration, plan_id")).all()
    return {"members": [_as_dict(row) for row in members], "plans": [_as_dict(row) for row in plans]}


def get_subscription(db: Session, membership_id: str):
    row = db.execute(
        text(SUBSCRIPTION_SELECT + " WHERE mp.membership_id = :membership_id"),
        {"membership_id": membership_id},
    ).first()
    return _as_dict(row)


def enroll_member(db: Session, request: SubscriptionEnrollRequest):
    if not request.member_id.strip() or not request.plan_id.strip():
        raise HTTPException(status_code=422, detail="Select both a member and a plan")
    try:
        with db.begin():
            today = db.execute(text("SELECT CURRENT_DATE")).scalar_one()
            start = request.start_date or today
            if start < today:
                raise HTTPException(status_code=422, detail="A new subscription cannot start in the past")
            member = db.execute(
                text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"),
                {"member_id": request.member_id.strip()},
            ).first()
            if not member:
                raise HTTPException(status_code=404, detail="Member not found")
            plan_id = request.plan_id.strip()
            duration = _get_duration(db, plan_id)
            end = _end_date(start, duration)
            if _find_overlapping_active(db, request.member_id.strip(), start, end):
                raise HTTPException(status_code=409, detail="This member already has an active subscription overlapping those dates")
            membership_id = _new_membership_id(db)
            db.execute(
                text("""
                    INSERT INTO members_plans (membership_id, member_id, plan_id, start_date, end_date, membership_status)
                    VALUES (:membership_id, :member_id, :plan_id, :start_date, :end_date, 'Active')
                """),
                {"membership_id": membership_id, "member_id": request.member_id.strip(), "plan_id": plan_id, "start_date": start, "end_date": end},
            )
        return get_subscription(db, membership_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A conflicting subscription record could not be created") from None


def renew_subscription(db: Session, membership_id: str, request: SubscriptionRenewRequest):
    try:
        with db.begin():
            today = db.execute(text("SELECT CURRENT_DATE")).scalar_one()
            initial = db.execute(
                text("SELECT member_id FROM members_plans WHERE membership_id = :membership_id"),
                {"membership_id": membership_id},
            ).first()
            if not initial:
                raise HTTPException(status_code=404, detail="Subscription not found")
            member_id = initial.member_id
            db.execute(text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"), {"member_id": member_id}).first()
            subscription = db.execute(
                text("SELECT membership_id, member_id, plan_id, start_date, end_date, membership_status FROM members_plans WHERE membership_id = :membership_id FOR UPDATE"),
                {"membership_id": membership_id},
            ).mappings().first()
            if not subscription:
                raise HTTPException(status_code=404, detail="Subscription not found")
            member_id = subscription["member_id"]
            end_date = subscription["end_date"]
            stored_status = subscription["membership_status"]
            if stored_status == "Cancelled":
                raise HTTPException(status_code=409, detail="Cancelled subscriptions cannot be renewed")
            is_expired = stored_status == "Expired" or (end_date is not None and end_date < today)
            start_date = subscription["start_date"]
            is_expiring = (
                stored_status == "Active"
                and (start_date is None or start_date <= today)
                and end_date is not None
                and today <= end_date <= today + timedelta(days=7)
            )
            if not (is_expired or is_expiring):
                raise HTTPException(status_code=409, detail="Only expired or soon-to-expire subscriptions can be renewed")
            plan_id = (request.plan_id or subscription["plan_id"] or "").strip()
            if not plan_id:
                raise HTTPException(status_code=422, detail="A membership plan is required")
            duration = _get_duration(db, plan_id)
            start = max(today, end_date + timedelta(days=1)) if end_date else today
            new_end = _end_date(start, duration)
            if _find_overlapping_active(db, member_id, start, new_end):
                raise HTTPException(status_code=409, detail="Another active subscription overlaps the renewal dates")
            new_id = _new_membership_id(db)
            db.execute(
                text("""
                    INSERT INTO members_plans (membership_id, member_id, plan_id, start_date, end_date, membership_status)
                    VALUES (:membership_id, :member_id, :plan_id, :start_date, :end_date, 'Active')
                """),
                {"membership_id": new_id, "member_id": member_id, "plan_id": plan_id, "start_date": start, "end_date": new_end},
            )
        return get_subscription(db, new_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A conflicting renewal could not be created") from None


def update_subscription_status(db: Session, membership_id: str, request: SubscriptionStatusUpdate):
    new_status = request.membership_status.strip()
    if new_status not in {"Active", "Expired", "Cancelled"}:
        raise HTTPException(status_code=422, detail="Status must be Active, Expired, or Cancelled")
    with db.begin():
        initial = db.execute(
            text("SELECT member_id FROM members_plans WHERE membership_id = :membership_id"),
            {"membership_id": membership_id},
        ).first()
        if not initial:
            return None
        db.execute(text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"), {"member_id": initial.member_id}).first()
        subscription = db.execute(
            text("SELECT member_id, start_date, end_date FROM members_plans WHERE membership_id = :membership_id FOR UPDATE"),
            {"membership_id": membership_id},
        ).mappings().first()
        if not subscription:
            return None
        if new_status == "Active":
            today = db.execute(text("SELECT CURRENT_DATE")).scalar_one()
            end = subscription["end_date"]
            start = subscription["start_date"]
            if end is not None and end < today:
                raise HTTPException(status_code=409, detail="An expired subscription must be renewed to become active")
            if _find_overlapping_active(db, subscription["member_id"], start or today, end or date.max, exclude_id=membership_id):
                raise HTTPException(status_code=409, detail="This member already has an overlapping active subscription")
        db.execute(
            text("UPDATE members_plans SET membership_status = :membership_status WHERE membership_id = :membership_id"),
            {"membership_status": new_status, "membership_id": membership_id},
        )
    return get_subscription(db, membership_id)


def delete_subscription(db: Session, membership_id: str):
    try:
        with db.begin():
            initial = db.execute(
                text("SELECT member_id FROM members_plans WHERE membership_id = :membership_id"),
                {"membership_id": membership_id},
            ).first()
            if not initial:
                return False, None
            db.execute(text("SELECT member_id FROM members WHERE member_id = :member_id FOR UPDATE"), {"member_id": initial.member_id}).first()
            row = db.execute(
                text("SELECT member_id, plan_id FROM members_plans WHERE membership_id = :membership_id FOR UPDATE"),
                {"membership_id": membership_id},
            ).first()
            if not row:
                return False, None
            payment_count = db.execute(
                text("SELECT COUNT(*) FROM payments WHERE member_id = :member_id AND plan_id = :plan_id"),
                {"member_id": row.member_id, "plan_id": row.plan_id},
            ).scalar_one()
            if payment_count:
                return True, "This subscription has associated payment history and cannot be deleted."
            db.execute(text("DELETE FROM members_plans WHERE membership_id = :membership_id"), {"membership_id": membership_id})
        return True, None
    except IntegrityError:
        db.rollback()
        return True, "This subscription is referenced by other records and cannot be deleted."

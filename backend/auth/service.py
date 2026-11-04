import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth.passwords import hash_password, verify_password
from backend.schemas.auth import AuthenticatedUser


SESSION_TTL_HOURS = int(os.getenv("AUTH_SESSION_TTL_HOURS", "12"))
_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class InvalidCredentials(Exception):
    pass


class AccountProvisioningError(Exception):
    pass


def authenticate(db: Session, email: str, password: str):
    normalized_email = email.strip().lower()
    account = db.execute(
        text(
            """SELECT account_id, email, password_hash, role, member_id,
                      trainer_employee_id
               FROM auth_accounts WHERE email = :email"""
        ),
        {"email": normalized_email},
    ).mappings().first()

    if account is None or not verify_password(password, account["password_hash"]):
        raise InvalidCredentials

    issued_at = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = issued_at + timedelta(hours=SESSION_TTL_HOURS)
    db.execute(
        text("DELETE FROM auth_sessions WHERE expires_at <= :now"),
        {"now": issued_at},
    )
    access_token = secrets.token_urlsafe(32)
    session_hash = hashlib.sha256(access_token.encode("utf-8")).hexdigest()
    db.execute(
        text(
            """INSERT INTO auth_sessions (session_id, account_id, expires_at)
               VALUES (:session_id, :account_id, :expires_at)"""
        ),
        {
            "session_id": session_hash,
            "account_id": account["account_id"],
            "expires_at": expires_at,
        },
    )
    db.commit()

    user = AuthenticatedUser(
        user_id=account["account_id"],
        role=account["role"],
        member_id=account["member_id"],
        trainer_employee_id=account["trainer_employee_id"],
    )
    return access_token, expires_at.replace(tzinfo=timezone.utc), user


def lookup_session(db: Session, session_hash: str):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    record = db.execute(
        text(
            """SELECT s.session_id, a.account_id, a.role, a.member_id,
                      a.trainer_employee_id
               FROM auth_sessions AS s
               JOIN auth_accounts AS a ON a.account_id = s.account_id
               WHERE s.session_id = :session_id AND s.expires_at > :now"""
        ),
        {"session_id": session_hash, "now": now},
    ).mappings().first()
    if record is None:
        return None
    user = AuthenticatedUser(
        user_id=record["account_id"],
        role=record["role"],
        member_id=record["member_id"],
        trainer_employee_id=record["trainer_employee_id"],
    )
    return record["session_id"], user


def revoke_session(db: Session, session_hash: str) -> None:
    db.execute(
        text("DELETE FROM auth_sessions WHERE session_id = :session_id"),
        {"session_id": session_hash},
    )
    db.commit()


def provision_account(
    db: Session,
    *,
    email: str,
    password: str,
    role: str,
    member_id: str | None = None,
    trainer_employee_id: str | None = None,
) -> int:
    normalized_email = email.strip().lower()
    if not _EMAIL_PATTERN.fullmatch(normalized_email):
        raise AccountProvisioningError("Enter a valid email address.")
    if role not in {"Admin", "Trainer", "Member"}:
        raise AccountProvisioningError("Role must be Admin, Trainer, or Member.")
    if role == "Admin" and (member_id or trainer_employee_id):
        raise AccountProvisioningError("Admin accounts cannot be linked to a member or trainer.")
    if role == "Member" and (not member_id or trainer_employee_id):
        raise AccountProvisioningError("Member accounts require only a member ID.")
    if role == "Trainer" and (not trainer_employee_id or member_id):
        raise AccountProvisioningError("Trainer accounts require only a trainer employee ID.")

    if member_id:
        found = db.execute(
            text("SELECT 1 FROM members WHERE member_id = :record_id"),
            {"record_id": member_id},
        ).first()
        if found is None:
            raise AccountProvisioningError("No member record exists with that ID.")
    if trainer_employee_id:
        found = db.execute(
            text("SELECT 1 FROM gym_trainers WHERE employee_id = :record_id"),
            {"record_id": trainer_employee_id},
        ).first()
        if found is None:
            raise AccountProvisioningError("No trainer record exists with that employee ID.")

    password_hash = hash_password(password)
    try:
        result = db.execute(
            text(
                """INSERT INTO auth_accounts
                   (email, password_hash, role, member_id, trainer_employee_id)
                   VALUES (:email, :password_hash, :role, :member_id,
                           :trainer_employee_id)"""
            ),
            {
                "email": normalized_email,
                "password_hash": password_hash,
                "role": role,
                "member_id": member_id,
                "trainer_employee_id": trainer_employee_id,
            },
        )
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise AccountProvisioningError(
            "That email or linked member/trainer already has an account."
        ) from error
    return int(result.lastrowid)

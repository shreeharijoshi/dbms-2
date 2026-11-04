from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.schemas.auth import AuthenticatedUser


def get_current_user(request: Request) -> AuthenticatedUser:
    user = getattr(request.state, "authenticated_user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed_roles: str):
    """FastAPI dependency for role-gating a route: Depends(require_roles('Admin'))."""
    allowed = frozenset(allowed_roles)

    def authorize(
        user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return user

    return authorize


def ensure_member_access(
    db: Session, user: AuthenticatedUser, member_id: str
) -> None:
    """Enforce record-level member scope for routes with a member ID parameter."""
    if user.role == "Admin":
        return
    if user.role == "Member" and user.member_id == member_id:
        return
    if user.role == "Trainer" and user.trainer_employee_id:
        assigned = db.execute(
            text(
                "SELECT 1 FROM members WHERE member_id = :member_id AND PT = :trainer_id"
            ),
            {"member_id": member_id, "trainer_id": user.trainer_employee_id},
        ).first()
        if assigned:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this member's data",
    )


def ensure_trainer_access(
    db: Session, user: AuthenticatedUser, trainer_employee_id: str
) -> None:
    """Enforce record-level trainer scope for routes with a trainer ID parameter."""
    if user.role == "Admin":
        return
    if user.role == "Trainer" and user.trainer_employee_id == trainer_employee_id:
        return
    if user.role == "Member" and user.member_id:
        assigned = db.execute(
            text(
                "SELECT 1 FROM members WHERE member_id = :member_id AND PT = :trainer_id"
            ),
            {"member_id": user.member_id, "trainer_id": trainer_employee_id},
        ).first()
        if assigned:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this trainer's data",
    )

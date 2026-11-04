from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.auth.service import InvalidCredentials, authenticate
from backend.schemas.auth import LoginRequest, LoginResponse


def login(login_data: LoginRequest, db: Session) -> LoginResponse:
    try:
        access_token, expires_at, user = authenticate(
            db, login_data.email, login_data.password
        )
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable",
        ) from None
    return LoginResponse(
        access_token=access_token,
        expires_at=expires_at,
        user=user,
    )

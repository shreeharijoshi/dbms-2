from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend.auth.controller import login as login_controller
from backend.auth.service import revoke_session
from backend.database.connection import get_db
from backend.middleware.authorization import get_current_user
from backend.schemas.auth import (
    AuthenticatedUser,
    LoginRequest,
    LoginResponse,
    MessageResponse,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return login_controller(login_data, db)


@router.get("/me", response_model=AuthenticatedUser)
def current_user(user: AuthenticatedUser = Depends(get_current_user)):
    return user


@router.post("/logout", response_model=MessageResponse)
def logout(request: Request, db: Session = Depends(get_db)):
    revoke_session(db, request.state.session_id)
    return MessageResponse(message="Logged out successfully")

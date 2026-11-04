import hashlib

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from backend.auth.service import lookup_session
from backend.database.connection import SessionLocal


_PUBLIC_PATHS = {
    "/auth/login",
    "/health",
    "/openapi.json",
    "/docs",
    "/docs/oauth2-redirect",
    "/redoc",
}


class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path = request.url.path.rstrip("/") or "/"
        if path in _PUBLIC_PATHS or path.startswith(("/docs/", "/redoc/")):
            return await call_next(request)

        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            return _unauthorized("Bearer token required")

        session_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()
        try:
            session = await run_in_threadpool(_lookup_session, session_hash)
        except SQLAlchemyError:
            return JSONResponse(
                status_code=503,
                content={"detail": "Authentication service is temporarily unavailable"},
            )
        if session is None:
            return _unauthorized("Invalid or expired session")

        request.state.session_id, request.state.authenticated_user = session
        return await call_next(request)


def _unauthorized(message: str) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


def _lookup_session(session_hash: str):
    db = SessionLocal()
    try:
        return lookup_session(db, session_hash)
    finally:
        db.close()

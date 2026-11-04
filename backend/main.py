import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.routes import router as authentication_router
from backend.members.routes import router as members_router
from backend.trainers.routes import router as trainers_router
from backend.membership_plans.routes import router as membership_plans_router
from backend.subscriptions.routes import router as subscriptions_router
from backend.payments.routes import router as payments_router
from backend.expenses.routes import router as expenses_router
from backend.inventory.routes import router as inventory_router
from backend.miscellaneous_employees.routes import router as miscellaneous_employees_router
from backend.trainer_portal.routes import router as trainer_portal_router
from backend.member_portal.routes import router as member_portal_router
from backend.analytics.routes import router as analytics_router
from backend.middleware.authentication import AuthenticationMiddleware


app = FastAPI(title="IronCore Gym Management API", version="1.0.0")
app.add_middleware(AuthenticationMiddleware)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(authentication_router)
app.include_router(members_router)
app.include_router(trainers_router)
app.include_router(membership_plans_router)
app.include_router(subscriptions_router)
app.include_router(payments_router)
app.include_router(expenses_router)
app.include_router(inventory_router)
app.include_router(miscellaneous_employees_router)
app.include_router(trainer_portal_router)
app.include_router(member_portal_router)
app.include_router(analytics_router)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}

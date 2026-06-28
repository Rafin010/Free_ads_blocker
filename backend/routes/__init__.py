from fastapi import APIRouter
from routes import auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# Future routes can be included here, e.g. sync, referral, rules

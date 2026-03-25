from fastapi import APIRouter
from app.api.v1.endpoints import search, analyze

api_router = APIRouter()

# Registering the endpoints.
# This creates the URL structure:
# /search/{icao}  -> handled by search.py
# /analyze/       -> handled by analyze.py

api_router.include_router(search.router, prefix="/search", tags=["Tactical Search"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["AI Intelligence"])
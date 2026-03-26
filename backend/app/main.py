from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router # <--- New Import: Brings in the Search & AI Logic

# --- Application Factory ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Tactical Aviation Intelligence Backend. Handles Scraping -> AI -> JSON pipeline.",
    version="1.0.0"
)

# --- Security & Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://notamlens.com",
        "https://www.notamlens.com", 
        "https://notamlens-frontend.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---
# Keep response lightweight to prevent false positives from load balancers.
@app.get("/health")
async def health_check():
    return {
        "status": "operational", 
        "env": "debug" if settings.DEBUG_MODE else "production",
        "system": "NotamLens v1"
    }

# --- Router Registration ---
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    # Local development entry point.
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
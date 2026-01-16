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
# CORS is annoying but necessary.
# In dev, we allow everything ("*"). 
# TODO: Before deploying to Prod, restrict 'allow_origins' to the specific frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---
# AWS/Docker needs this to know if the container is alive.
# Keep it lightweight (no DB calls) so load balancers don't kill the pod falsely.
@app.get("/health")
async def health_check():
    return {
        "status": "operational", 
        "env": "debug" if settings.DEBUG_MODE else "production",
        "system": "Agent NOTAM v1"
    }

# --- Router Registration ---
# This connects our "Brain" (Search/Analyze) to the web server.
# Without this line, the app is just an empty shell.
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    # Local dev entry point. 
    # 'reload=True' is essential for DX (Developer Experience) so we don't restart on every save.
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # App Identity
    PROJECT_NAME: str = "Agent NOTAM"
    API_V1_STR: str = "/api/v1"
    
    # Debug Toggle
    # Note: Keep False in production. Leaking stack traces to users is a security risk.
    DEBUG_MODE: bool = False
    
    # Secrets
    # If this is missing from .env, Pydantic will throw a validation error at startup.
    # Better to crash now than fail silently later when a user tries to run a query.
    GEMINI_API_KEY: str
    
    # Infrastructure
    # Defaulting to local Redis. If we deploy to AWS, override this env var.
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cache Policy
    # 600s (10 mins) seems like the sweet spot.
    # Too short = higher scraping costs. Too long = pilots might miss critical updates.
    REDIS_TTL: int = 600  

    # Config Loader
    # "ignore" extra fields prevents crashes if we have stale keys in the local .env file.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    # Optimization: Reading os.environ is fast, but reading .env from disk is slow.
    # We cache this object so we only hit the filesystem once (on startup).
    return Settings()

settings = get_settings()
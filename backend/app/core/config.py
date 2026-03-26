import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # App Identity
    PROJECT_NAME: str = "NotamLens"
    API_V1_STR: str = "/api/v1"
    
    # Security: Must be False in production
    DEBUG_MODE: bool = False
    
    # Required secrets. Fails fast on startup if missing.
    GEMINI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    
    # Infrastructure dependencies
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cache TTL in seconds (Tradeoff: Performance vs Data Staleness)
    REDIS_TTL: int = 600

    # Allows extra unenforced variables in local environment files
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    # Cache configuration parsing to optimize startup/initialization.
    return Settings()

settings = get_settings()
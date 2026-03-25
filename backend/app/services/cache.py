import os
import json
import time


def _build_cache():
    """
    Returns a cache backend: Redis if REDIS_URL is set, otherwise an in-process dict with TTL.
    """
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        return _RedisCache(redis_url)
    return _DictCache()


class _RedisCache:
    """Thin wrapper around redis so callers use `get` / `set` with TTL."""

    def __init__(self, url: str):
        import redis
        self._r = redis.from_url(url, decode_responses=True)

    def get(self, key: str):
        try:
            raw = self._r.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as e:
            print(f"Redis get error: {e}")
            return None

    def set(self, key: str, value, ttl: int = 1800):
        try:
            self._r.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            print(f"Redis set error: {e}")


class _DictCache:
    """Simple in-memory dict cache with per-key TTL expiry."""

    def __init__(self):
        self._store: dict[str, tuple[float, object]] = {}

    def get(self, key: str):
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value, ttl: int = 1800):
        self._store[key] = (time.time() + ttl, value)


cache = _build_cache()

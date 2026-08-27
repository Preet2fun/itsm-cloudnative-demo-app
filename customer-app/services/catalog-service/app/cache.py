import hashlib
import json
import logging

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def init_cache(redis_url: str) -> None:
    global _redis
    _redis = aioredis.from_url(redis_url, decode_responses=True)
    logger.info("Redis client initialised")


async def close_cache() -> None:
    if _redis:
        await _redis.aclose()
        logger.info("Redis client closed")


def _cache_key(tenant_slug: str, resource: str, operation: str, params: dict) -> str:
    h = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
    return f"customer:{tenant_slug}:{resource}:{operation}:{h}"


async def cache_get(tenant_slug: str, resource: str, operation: str, params: dict) -> str | None:
    key = _cache_key(tenant_slug, resource, operation, params)
    try:
        return await _redis.get(key)
    except Exception as exc:
        logger.warning("Redis GET failed (non-fatal): %s", exc)
        return None


async def cache_set(
    tenant_slug: str,
    resource: str,
    operation: str,
    params: dict,
    value: str,
    ttl: int = 60,
) -> None:
    key = _cache_key(tenant_slug, resource, operation, params)
    try:
        await _redis.set(key, value, ex=ttl)
    except Exception as exc:
        logger.warning("Redis SET failed (non-fatal): %s", exc)


async def cache_invalidate(tenant_slug: str, resource: str) -> None:
    """Delete all cache keys for a tenant+resource on write operations."""
    pattern = f"customer:{tenant_slug}:{resource}:*"
    try:
        async for key in _redis.scan_iter(pattern):
            await _redis.delete(key)
    except Exception as exc:
        logger.warning("Redis invalidate failed (non-fatal): %s", exc)

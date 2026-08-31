from __future__ import annotations

from app import cache


def test_cache_key_is_deterministic_and_order_independent():
    key1 = cache._cache_key("customer_a", "restaurants", "list", {"limit": 20, "offset": 0})
    key2 = cache._cache_key("customer_a", "restaurants", "list", {"offset": 0, "limit": 20})
    assert key1 == key2
    assert key1.startswith("customer:customer_a:restaurants:list:")


def test_cache_key_differs_by_params():
    key1 = cache._cache_key("customer_a", "restaurants", "list", {"limit": 20, "offset": 0})
    key2 = cache._cache_key("customer_a", "restaurants", "list", {"limit": 20, "offset": 20})
    assert key1 != key2


async def test_cache_get_returns_none_when_redis_unavailable():
    assert cache._redis is None
    assert await cache.cache_get("customer_a", "restaurants", "list", {}) is None


async def test_cache_set_and_invalidate_do_not_raise_when_redis_unavailable():
    assert cache._redis is None
    await cache.cache_set("customer_a", "restaurants", "list", {}, "payload")
    await cache.cache_invalidate("customer_a", "restaurants")

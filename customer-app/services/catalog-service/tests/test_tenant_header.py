from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.router import _tenant


@pytest.mark.parametrize(
    "value",
    ["a", "customer_a", "customer_b", "z9", "a" * 63],
)
def test_tenant_accepts_valid_slugs(value):
    assert _tenant(value) == value


@pytest.mark.parametrize(
    "value",
    [
        "",
        "Customer_A",
        "1abc",
        "customer-a",
        "customer a",
        "a" * 64,
        "_customer",
    ],
)
def test_tenant_rejects_invalid_slugs(value):
    with pytest.raises(HTTPException) as exc_info:
        _tenant(value)
    assert exc_info.value.status_code == 400

package envoy.authz

import future.keywords.if

# ── Public paths ─────────────────────────────────────────────────────────
test_public_login_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/auth/login", "headers": {}
  }}}}
}

test_public_mfa_send_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/auth/mfa/send", "headers": {}
  }}}}
}

test_public_jwks_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/.well-known/jwks.json", "headers": {}
  }}}}
}

test_public_health_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents/health", "headers": {}
  }}}}
}

test_public_non_api_path_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/_next/static/chunk.js", "headers": {}
  }}}}
}

# ── Admin ────────────────────────────────────────────────────────────────
test_admin_allowed_any_path if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "DELETE", "path": "/api/v1/users/123", "headers": {"x-user-role": "admin"}
  }}}}
}

# ── Agent ────────────────────────────────────────────────────────────────
test_agent_allowed_incidents_write if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/incidents", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_allowed_assets_write if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "PUT", "path": "/api/v1/assets/1", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_denied_assets_delete if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "DELETE", "path": "/api/v1/assets/1", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_allowed_users_read if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/users", "headers": {"x-user-role": "agent"}
  }}}}
}

test_agent_denied_users_write if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/users", "headers": {"x-user-role": "agent"}
  }}}}
}

# ── Viewer ───────────────────────────────────────────────────────────────
test_viewer_allowed_incidents_read if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {"x-user-role": "viewer"}
  }}}}
}

test_viewer_denied_incidents_write if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/incidents", "headers": {"x-user-role": "viewer"}
  }}}}
}

# ── Default deny ─────────────────────────────────────────────────────────
test_no_role_denied_protected_path if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {}
  }}}}
}

test_unknown_role_denied_protected_path if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {"x-user-role": "nobody"}
  }}}}
}

# ── Customer-app (Phase 4) ───────────────────────────────────────────────
# No new allow rules needed for these — the existing unscoped
# `allow if { role == "admin" }` already covers them, and no existing
# agent/viewer rule mentions these paths, so default allow := false already
# denies non-admin roles. See
# docs/superpowers/specs/2026-09-17-customer-app-opa-rbac-design.md §3
# Decision 1 for the full reasoning.

test_admin_allowed_customer_app_restaurants if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/restaurants", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_orders if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "POST", "path": "/api/v1/orders", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_deliveries if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "PUT", "path": "/api/v1/deliveries/1/status", "headers": {"x-user-role": "admin"}
  }}}}
}

test_admin_allowed_customer_app_payments if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/payments", "headers": {"x-user-role": "admin"}
  }}}}
}

test_viewer_denied_customer_app_restaurants if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/restaurants", "headers": {"x-user-role": "viewer"}
  }}}}
}

test_agent_denied_customer_app_orders if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/orders", "headers": {"x-user-role": "agent"}
  }}}}
}

test_no_role_denied_customer_app_payments if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/payments", "headers": {}
  }}}}
}

test_customer_app_health_allowed if {
  allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/health", "headers": {}
  }}}}
}

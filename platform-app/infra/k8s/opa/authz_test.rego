package envoy.authz

import future.keywords.if

# ── The `role` helper itself (JWT signature verification) ──────────────────
# Tests below use a REAL token issued live by user-service on 2026-09-17
# (owner@customer-b.example, role: admin) so decode_verify's signature check
# is exercised against a genuinely valid signature, not a stubbed one.
# Verification time is pinned via `with time.now_ns as ...` to a moment
# shortly after the token's `iat` (1789625373s => 1789625433000000000ns) so
# this test stays deterministic forever, independent of the token's real
# `exp` (1789711773s) and of whatever the local clock happens to read.
real_admin_jwt := "eyJhbGciOiJSUzI1NiIsImtpZCI6Iml0c20tcnMyNTYtdjEiLCJ0eXAiOiJKV1QifQ.eyJ0ZW5hbnRfaWQiOiJjdXN0b21lcl9iIiwicm9sZSI6ImFkbWluIiwiZW1haWwiOiJvd25lckBjdXN0b21lci1iLmV4YW1wbGUiLCJpc3MiOiJpdHNtLXVzZXItc2VydmljZSIsInN1YiI6Ijg5NzU4Y2VkLTM2OTctNDQ1Ni05Mzc4LTVjYzk4N2MxYzBmOSIsImV4cCI6MTc4OTcxMTc3MywiaWF0IjoxNzg5NjI1MzczLCJqdGkiOiJmZTBlOGYzNC1jYjE0LTRhZjgtOWI1OC00YjJhOWI3MjRhNGEifQ.Yxepm6PmxpDxFIl3O7FDD02DvHvSlsmgoiwXBw8xOp0CDp2WZvIA-kmEra0wmGrWKBg2oRzcDHltVHcc3cS82epSQJM5_H85IwuBIIYT2d1GEsRsdS4V4ptlvaz6Z1_s0HkaRTpbxmKVQHyO2guJjbLyVyi5NXV7HZwcBgCFGZWo6Et1ka1k9gJtw11bI8TT-XMR9s_0Xf5ixM9sL8URQOLmcAZlJce5SupMdxM8bC8R5pwsZUQpEdZ2HRj4n5BOX_aldJpaUU9z4Q52tWDFZuk8mFOa3wywNscUUr_LEuhMOu-7HUNiR0zjnXLJc42I7TA8jjlBgoOfl1gFvCOBOg"
pinned_verify_time_ns := 1789625433000000000

test_role_resolves_from_real_signed_jwt if {
  role == "admin" with input as {"attributes": {"request": {"http": {
    "headers": {"authorization": concat(" ", ["Bearer", real_admin_jwt])}
  }}}} with time.now_ns as pinned_verify_time_ns
}

test_role_undefined_when_no_authorization_header if {
  not role with input as {"attributes": {"request": {"http": {
    "headers": {}
  }}}} with time.now_ns as pinned_verify_time_ns
}

test_role_undefined_for_garbage_token if {
  not role with input as {"attributes": {"request": {"http": {
    "headers": {"authorization": "Bearer not-a-real-jwt"}
  }}}} with time.now_ns as pinned_verify_time_ns
}

test_role_undefined_for_wrong_signature if {
  # same header/payload as real_admin_jwt, signature bytes altered by one
  # character - must fail verification, proving decode_verify actually
  # checks the signature and doesn't just trust the claims.
  tampered := "eyJhbGciOiJSUzI1NiIsImtpZCI6Iml0c20tcnMyNTYtdjEiLCJ0eXAiOiJKV1QifQ.eyJ0ZW5hbnRfaWQiOiJjdXN0b21lcl9iIiwicm9sZSI6ImFkbWluIiwiZW1haWwiOiJvd25lckBjdXN0b21lci1iLmV4YW1wbGUiLCJpc3MiOiJpdHNtLXVzZXItc2VydmljZSIsInN1YiI6Ijg5NzU4Y2VkLTM2OTctNDQ1Ni05Mzc4LTVjYzk4N2MxYzBmOSIsImV4cCI6MTc4OTcxMTc3MywiaWF0IjoxNzg5NjI1MzczLCJqdGkiOiJmZTBlOGYzNC1jYjE0LTRhZjgtOWI1OC00YjJhOWI3MjRhNGEifQ.XxepXX6PmxpDxFIl3O7FDD02DvHvSlsmgoiwXBw8xOp0CDp2WZvIA-kmEra0wmGrWKBg2oRzcDHltVHcc3cS82epSQJM5_H85IwuBIIYT2d1GEsRsdS4V4ptlvaz6Z1_s0HkaRTpbxmKVQHyO2guJjbLyVyi5NXV7HZwcBgCFGZWo6Et1ka1k9gJtw11bI8TT-XMR9s_0Xf5ixM9sL8URQOLmcAZlJce5SupMdxM8bC8R5pwsZUQpEdZ2HRj4n5BOX_aldJpaUU9z4Q52tWDFZuk8mFOa3wywNscUUr_LEuhMOu-7HUNiR0zjnXLJc42I7TA8jjlBgoOfl1gFvCOBOg"
  not role with input as {"attributes": {"request": {"http": {
    "headers": {"authorization": concat(" ", ["Bearer", tampered])}
  }}}} with time.now_ns as pinned_verify_time_ns
}

# ── RBAC path/method logic — decoupled from JWT parsing ────────────────────
# These inject `role` directly via `with role as "..."` rather than building
# a signed JWT for every case: this suite's job is to verify the ALLOW
# rules' own path/method logic, not to re-prove signature verification for
# every role (already covered above, once, for the mechanism itself). Also
# means these tests never need a real signed token for agent/viewer, which
# this session has no way to mint (would need user-service's private key).

# ── Public paths (no role involved) ─────────────────────────────────────
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
  allow with role as "admin"
    with input as {"attributes": {"request": {"http": {
      "method": "DELETE", "path": "/api/v1/users/123", "headers": {}
    }}}}
}

# ── Agent ────────────────────────────────────────────────────────────────
test_agent_allowed_incidents_write if {
  allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "POST", "path": "/api/v1/incidents", "headers": {}
    }}}}
}

test_agent_allowed_assets_write if {
  allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "PUT", "path": "/api/v1/assets/1", "headers": {}
    }}}}
}

test_agent_denied_assets_delete if {
  not allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "DELETE", "path": "/api/v1/assets/1", "headers": {}
    }}}}
}

test_agent_allowed_users_read if {
  allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/users", "headers": {}
    }}}}
}

test_agent_denied_users_write if {
  not allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "POST", "path": "/api/v1/users", "headers": {}
    }}}}
}

# ── Viewer ───────────────────────────────────────────────────────────────
test_viewer_allowed_incidents_read if {
  allow with role as "viewer"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/incidents", "headers": {}
    }}}}
}

test_viewer_denied_incidents_write if {
  not allow with role as "viewer"
    with input as {"attributes": {"request": {"http": {
      "method": "POST", "path": "/api/v1/incidents", "headers": {}
    }}}}
}

# ── Default deny ─────────────────────────────────────────────────────────
test_no_role_denied_protected_path if {
  not allow with input as {"attributes": {"request": {"http": {
    "method": "GET", "path": "/api/v1/incidents", "headers": {}
  }}}}
}

test_unknown_role_denied_protected_path if {
  not allow with role as "nobody"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/incidents", "headers": {}
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
  allow with role as "admin"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/restaurants", "headers": {}
    }}}}
}

test_admin_allowed_customer_app_orders if {
  allow with role as "admin"
    with input as {"attributes": {"request": {"http": {
      "method": "POST", "path": "/api/v1/orders", "headers": {}
    }}}}
}

test_admin_allowed_customer_app_deliveries if {
  allow with role as "admin"
    with input as {"attributes": {"request": {"http": {
      "method": "PUT", "path": "/api/v1/deliveries/1/status", "headers": {}
    }}}}
}

test_admin_allowed_customer_app_payments if {
  allow with role as "admin"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/payments", "headers": {}
    }}}}
}

test_viewer_denied_customer_app_restaurants if {
  not allow with role as "viewer"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/restaurants", "headers": {}
    }}}}
}

test_agent_denied_customer_app_orders if {
  not allow with role as "agent"
    with input as {"attributes": {"request": {"http": {
      "method": "GET", "path": "/api/v1/orders", "headers": {}
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

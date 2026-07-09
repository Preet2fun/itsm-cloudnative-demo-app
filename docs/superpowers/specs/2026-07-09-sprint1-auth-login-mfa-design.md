# Sprint 1 — Authentication (Login + Email OTP MFA) — Design

Status: approved by user, ready for implementation planning
Scope: Product track, Sprint 1 (GitHub issue #9). Frontend UI + user-service
backend + OPA policy update, deployed and validated on the itsm-dev cluster.

## 1. Motivation

Sprint 1 is the first full-stack sprint on the Product track: UI → Backend →
Infra → K8s Deploy → E2E test, gated on Platform's Phase 6 (Istio + OPA)
being live on the dev cluster — which it now is, validated earlier in this
work (JWT RS256 issuance confirmed end-to-end via JWKS, unauthenticated API
calls return 403, mTLS STRICT confirmed active).

Unlike later sprints (which build against `data.jsx` mock data until Sprint
11), auth cannot be faked — Sprint 1 wires to the real `user-service` from
the start.

## 2. Scope decisions (resolved during brainstorming)

| Question | Decision | Why |
|---|---|---|
| SSO buttons (Okta/Azure/Google) shown in the prototype | **Omit entirely from Sprint 1** | No SSO backend exists or is planned for this sprint; issue #9's backend checklist has zero SSO tasks. Rendering dead buttons was rejected in favor of not shipping non-functional UI. `CLAUDE.md`'s Product Track table description will be corrected to drop "+ SSO" from the Sprint 1 row as part of this work. |
| Where to land after successful login (App Shell/Sprint 2 doesn't exist yet) | **New minimal placeholder page** — "Welcome, {email} — App Shell coming in Sprint 2" | Avoids landing on the Sprint 0 dev/debug component-preview route, which would look broken/unfinished to anyone testing the flow. |
| Sequencing across UI / backend / infra layers | **One combined plan, ordered backend-first** | The API contract (Login response shape, MFA endpoints) must be real before the UI wires to it — building UI-first against a guessed contract risks rework. Both layers ship in this one plan with per-layer test/review checkpoints, not two separate spec cycles. |
| OTP session hand-off between `/login` and `/login/mfa` | **React Router navigation state** (`navigate("/login/mfa", { state: { sessionId } })`) | No sensitive value persisted to storage. `/login/mfa` redirects back to `/login` if `location.state.sessionId` is missing (direct URL visit or page refresh) — matches how most real MFA flows behave (refresh = restart). Rejected sessionStorage (unnecessary XSS-adjacent exposure of a security-sensitive value) and URL query param (worst option — leaks into browser history/server logs). |

## 3. Frontend

### Routes (React Router, added to `services/frontend/src/App.tsx`)

- `/login` — email + password form (split-screen brand panel + form panel, per `design_handoff_synap/reference/auth.jsx`)
- `/login/mfa` — 6-digit code entry (guarded: redirects to `/login` if no in-flight `sessionId` in router state)
- `/forgot-password` — stub, pixel-matched to the prototype's "Forgot?" flow, no backend call
- New placeholder route (e.g. `/welcome`) — shown immediately after successful MFA verify

### Visual spec

Pixel-match `design_handoff_synap/reference/auth.jsx`'s `LoginScreen` component minus the `SsoButton` block and the "or with email" divider (no longer needed without SSO options above it). Brand panel (left, 52% width, dark gradient background, stats: 96%/41min/64%), form panel (right, 48% width) — per the existing OKLCH token system from Sprint 0, no hardcoded colors.

MFA screen: 6 individual digit boxes with auto-advance focus on input (matches prototype exactly), "Verify & continue" button (explicit click required — not auto-submit on 6th digit, matching the prototype's actual behavior), "Didn't get a code? Resend" link. Copy changes from the prototype's "authenticator app" wording to "the code we emailed to you" — matches the real email-OTP mechanism (issue #9), not TOTP.

### State / data layer

- **TanStack Query** added as a dependency (already pre-approved in the stack per `CLAUDE.md` section 6/10, not yet installed in `package.json`) — used for the login, MFA-send, and MFA-verify mutations.
- **No Zustand this sprint.** No cross-cutting UI state exists yet (copilot/theme/persona concerns arrive in Sprint 2). `useTheme` (Sprint 0) is unaffected.
- Plain controlled `useState` inputs for the two-field login form and the 6-digit MFA input — matches the prototype's own pattern; no react-hook-form/zod needed for this form's complexity.
- `services/frontend/src/lib/types.ts` gains: `LoginResponse` changes shape (see §4), plus new `MfaSendRequest`/`MfaSendResponse`, `MfaVerifyRequest`/`MfaVerifyResponse` types.
- `services/frontend/src/lib/api.ts`'s `authApi` gains `mfaSend()` and `mfaVerify()` methods, both `public: true` (no JWT yet at this point in the flow).

## 4. Backend (`services/user-service`, Go)

### `POST /api/v1/auth/login` — behavior change

Currently (per `internal/handlers/auth.go`): validates credentials, issues a JWT directly, returns `{token, expiresAt, user}`.

New behavior: on valid credentials, generates a `session_id` (UUID) and writes a pending-session record to Redis at `itsm:{tenant_slug}:auth-session:{session_id}` (value: user ID, email, role, tenant_id — everything `issueToken` needs later) with a 10-minute TTL. Returns `{mfa_required: true, session_id}` — no token yet. Invalid credentials still return `401` as today.

### `POST /api/v1/auth/mfa/send` (new)

Input: `{session_id}`. Reads the pending-session record written by `Login` above (`itsm:{tenant_slug}:auth-session:{session_id}` — tenant_slug is not a request param here, so this lookup requires either a session-id-keyed index or storing tenant_slug alongside the session_id in a way the handler can resolve before it knows the tenant; simplest fix: prefix the Redis key with a fixed namespace instead of tenant_slug for this lookup stage, e.g. `itsm:auth-session:{session_id}`, since session_id is already a globally-unique UUID and tenant scoping isn't needed until the OTP itself is stored). If no matching session (expired/invalid `session_id`): `401`. Otherwise generates a 6-digit numeric OTP, stores it at `itsm:{tenant_slug}:otp:{session_id}` (tenant_slug now known from the session record) with a 5-minute TTL. If `SMTP_HOST` env var is unset (dev mode), logs the OTP to stdout instead of sending email. Returns `200` with no OTP value in the response body (never leak the code to the client).

Resend = re-calling this same endpoint with the same `session_id` — generates a fresh code and resets the 5-minute TTL. No artificial resend cooldown for this sprint (dev-mode stdout logging carries no real spam risk).

### `POST /api/v1/auth/mfa/verify` (new)

Input: `{session_id, code}`. Looks up the OTP in Redis; on match, deletes the OTP Redis key (single-use), reads the pending-session record (same one `mfa/send` read) for the user/tenant details, issues the real RS256 JWT via the existing `issueToken` path, deletes the pending-session record, and returns `{token, expiresAt, user}` — the same shape the old `/login` used to return directly. On wrong code or expired/missing Redis key: `401`.

### Multi-tenant

OTP Redis key is scoped to `tenant_slug` (from the original login request), matching the existing `itsm:{tenant_slug}:{resource}:{operation}:{hash}` cache-key convention from `CLAUDE.md` section 8. JWT issued at the end still carries `tenant_id` in its claims as before — no change to the token structure itself, only to when/how it's issued.

### OpenTelemetry instrumentation

`CLAUDE.md` section 5 requires both auto- and manual instrumentation on every business operation, "from Day One." Current state in `user-service`: `otelhttp` auto-instrumentation and a `TracerProvider` already exist (`telemetry.Init`, `services/user-service/telemetry/telemetry.go`); the existing `Login` handler already emits an `itsm.user.login` span with the two required attributes (`tenant.id`, `user.role`). There is currently **no metrics pipeline at all** in this service — `telemetry.Init` only sets up traces, no `MeterProvider` exists anywhere in the codebase. This sprint is the first to add one.

**Traces** (extends the existing pattern, one span per handler):
- `itsm.user.login` (existing span, no rename) — behavior changes: since a successful call no longer means "fully authenticated" (MFA still pending), replace the existing `span.AddEvent("login_success")` with `span.AddEvent("credentials_valid")`. Attributes unchanged: `tenant.id`, `user.role` (both already set today).
- `itsm.user.mfa_send` (new) — attributes `tenant.id`, `user.role` (read from the pending-session record). `span.RecordError`/`span.SetStatus(codes.Error, ...)` on invalid/expired `session_id`, matching the existing error-handling pattern in `auth.go`.
- `itsm.user.mfa_verify` (new) — same attribute set; `span.AddEvent("mfa_verify_success")` on the success path (this is the true "fully authenticated" event, replacing where `login_success` used to fire); `SetStatus(codes.Error, ...)` on wrong/expired code.

**Metrics** (new — first metrics in this service, so `telemetry.Init` needs to grow a `MeterProvider` + OTLP gRPC metric exporter alongside its existing `TracerProvider`, using the same collector endpoint/connection):
- `itsm_login_attempts_total{tenant, result}` counter — `result` = `success` | `invalid_credentials` | `inactive_account`
- `itsm_mfa_otp_sent_total{tenant}` counter
- `itsm_mfa_verify_attempts_total{tenant, result}` counter — `result` = `success` | `invalid_code` | `expired`

Naming follows the `itsm_<domain>_<verb>_total{tenant, ...}` convention already established by `CLAUDE.md` section 5's example metrics list (`itsm_incidents_created_total`, etc.) — these three are additions to that list, not a new convention.

**Logs:** continues the existing pattern — structured `slog` JSON logging for operational events (already used throughout `main.go`), no new log-correlation infrastructure needed since no log aggregation backend exists yet (Loki is P-Phase 6, Pending). The one new log line this sprint requires is the dev-mode OTP fallback itself (`slog.Info` with the generated code, only when `SMTP_HOST` is unset) — this is a deliberate, explicit operational log per issue #9's dev-mode requirement, not a substitute for span-based error tracking.

**Known limitation, not a Sprint 1 blocker:** the OTel Collector itself (`infra/observability/otel-collector/` is currently just an empty placeholder directory) has not been deployed — that is Platform-track P-Phase 6 (Observability), still Pending. `OTEL_EXPORTER_OTLP_ENDPOINT` already points at `otel-collector.itsm-dev:4317` (set via `global.otelCollectorEndpoint` in `values.yaml`), so traces and metrics emitted by this sprint's new spans/counters will export correctly the moment P-Phase 6 stands up the Collector — no code changes needed then. Until it exists, OTLP exports fail silently in the background (already true today for every existing span in this service; not a new condition introduced by this sprint).

## 5. Istio / OPA

Two new Rego `public if {...}` rules added to `infra/k8s/opa/policy-configmap.yaml` (identified during Phase 6 validation earlier, not yet applied):

```rego
public if { path == "/api/v1/auth/mfa/send" }
public if { path == "/api/v1/auth/mfa/verify" }
```

Without these, OPA's default-deny would 403 both endpoints, since a user has no JWT yet at the MFA step — that's the whole point of the flow. The existing `deny-unauthenticated-api` Istio AuthorizationPolicy (`infra/k8s/istio/authorization-policies/dev/`) does not need changes — it doesn't list these paths as protected already, since they fall under the general `/api/v1/auth/` prefix which `virtual-service.yaml` already routes to `user-service` without requiring a JWT at the mesh level.

Redeploy: `kubectl apply -f infra/k8s/opa/policy-configmap.yaml` + `kubectl rollout restart deployment/opa -n itsm-dev` (per the existing troubleshooting note in `docs/platform/deployment-guides/Phase_06_Istio_OPA.md` for updating OPA policy without full redeployment).

## 6. Infra / deploy

- `services/user-service` version bump: check `services/user-service/VERSION` at implementation time and bump per semver (backend behavior change + 2 new endpoints = at least a minor bump).
- `services/frontend` version bump: `services/frontend/VERSION` from `0.1.0` → `0.2.0` (matches the existing `CHANGELOG.md` `[Unreleased] Planned (v0.2.0 — Sprint 1)` section, which already documents this exact scope).
- Both images rebuilt and pushed with their new version tags (not `latest` — per the tag-pinning fix already applied to every other service in this repo this session).
- `infra/helm/itsm-app/values.yaml`: bump `userService.image.tag` and `frontend.image.tag` to the new versions.
- No new Helm templates needed — existing `Deployment`/`Service` templates for both services are unchanged structurally.

## 7. E2E acceptance tests (per issue #9, using existing seeded test users)

1. Login with `alice.admin@globaltech.io` / `Password1!` / `tenant_a` → OTP logged to `user-service` stdout → enter code on `/login/mfa` → lands on the Sprint-2-placeholder page with JWT stored.
2. Login with `bob.agent@startupco.io` (tenant_b) → separate session, separate JWT, no cross-tenant leakage.
3. Wrong OTP code → `401` from `/api/v1/auth/mfa/verify`.
4. Expired OTP (wait 6+ minutes, or manually expire the Redis key) → `401`.
5. Refreshing the browser mid-MFA (on `/login/mfa`) → redirected back to `/login` (session-hand-off design from §2).
6. OTel sanity check: with `OTEL_EXPORTER_OTLP_ENDPOINT` pointed at a real (or `otel/opentelemetry-collector` debug-exporter test) collector, confirm the three new spans (`itsm.user.login`, `itsm.user.mfa_send`, `itsm.user.mfa_verify`) and three new metrics (`itsm_login_attempts_total`, `itsm_mfa_otp_sent_total`, `itsm_mfa_verify_attempts_total`) actually emit with correct attributes — this can be done with a local `docker run otel/opentelemetry-collector --config ... ` debug exporter or a temporary log-only collector config, since the real cluster Collector doesn't exist yet (P-Phase 6). Without this check, a bug in the new `MeterProvider` wiring could silently no-op forever and go unnoticed until P-Phase 6 ships.

## 8. Explicit non-goals

- No SSO/OIDC/SAML implementation or UI (see §2).
- No App Shell / real post-login destination (Sprint 2).
- No rate-limiting or lockout after N failed OTP attempts (not required by issue #9; can be added later if needed).
- No real SMTP/email provider integration — stdout logging only, per issue #9's explicit dev-mode fallback.
- No changes to the JWT claim structure, JWKS endpoint, or RS256 signing — those are already correct from Phase 6.
- No deployment of the OTel Collector, Prometheus, Loki, Jaeger, or Grafana — that entire stack is Platform-track P-Phase 6 (Observability), a separate not-yet-started phase. This sprint only adds correctly-instrumented spans/metrics that will start flowing the moment that phase ships.

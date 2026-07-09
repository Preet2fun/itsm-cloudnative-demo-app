# Sprint 1 — Authentication (Login + Email OTP MFA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full Sprint 1 vertical slice — real email/password + email-OTP MFA login, backend-first — wired end to end on the itsm-dev cluster, per GitHub issue #9 and the approved design spec.

**Architecture:** `user-service` (Go) changes `Login` to a two-step flow (`credentials → session_id`, then `mfa/send` + `mfa/verify → JWT`), backed by a new Redis-based session store and OTel metrics. The frontend (Vite + React) adds `/login`, `/login/mfa`, `/forgot-password`, and a Sprint-2 placeholder route, wired to the real backend via TanStack Query. OPA's Rego policy gains two public-path exemptions for the new pre-JWT endpoints. Both services get version bumps, real Docker tags, and a full deploy + E2E verification pass on `itsm-dev`.

**Tech Stack:** Go 1.22, Chi v5, `github.com/redis/go-redis/v9` (new), OTel Go SDK v1.27.0 (traces — existing; metrics — new), Vite + React 18 + TypeScript, TanStack Query (new), Vitest + React Testing Library (new), Helm, Istio/OPA.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-09-sprint1-auth-login-mfa-design.md` — read it if a task's reasoning is unclear.
- Repo root: `/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app`
- No SSO UI or backend (spec §2). No App Shell (Sprint 2). No OTel Collector deployment (Platform P-Phase 6). No SMTP integration — dev-mode stdout OTP logging only.
- Redis client: `github.com/redis/go-redis/v9` (user-confirmed). Frontend test stack: Vitest + `@testing-library/react` (user-confirmed).
- Session hand-off: React Router navigation state (`navigate(path, { state })`), never sessionStorage or URL params (spec §2).
- OTP Redis key: `itsm:{tenant_slug}:otp:{session_id}`, 5-minute TTL. Pending-session Redis key: `itsm:auth-session:{session_id}` (global namespace — tenant isn't known until the record is read), 10-minute TTL.
- New OTel spans: `itsm.user.mfa_send`, `itsm.user.mfa_verify` (attributes: `tenant.id`, `user.role`). Existing `itsm.user.login` span's `login_success` event renamed to `credentials_valid`.
- New OTel metrics: `itsm_login_attempts_total{tenant, result}`, `itsm_mfa_otp_sent_total{tenant}`, `itsm_mfa_verify_attempts_total{tenant, result}` — all counters.
- Version targets: `services/user-service` → `0.4.0` (with a retroactive `0.3.0` CHANGELOG entry for the already-shipped-but-undocumented RS256 migration). `services/frontend` → `0.2.0`.
- Image tags are pinned to the exact semver (never `latest` — established convention from this session's Phase 6 work). `imagePullPolicy` stays `IfNotPresent` once a real version tag is used (the `Always` workaround was only needed while iterating under the floating `latest` tag).
- Deploy target: `itsm-dev` namespace only. Do not touch `values-qa.yaml`.
- Go tests requiring live infra (`DATABASE_URL`, `REDIS_URL`) skip via `t.Skip(...)` when those env vars are unset — no live-infra mocking framework is introduced. This is a deliberate, scoped choice (see spec discussion) — not a gap to silently fix by adding mocking infrastructure.
- Existing seeded test users (already confirmed live on the dev cluster): `alice.admin@globaltech.io` / `Password1!` / `tenant_a` (role: admin), `bob.agent@startupco.io` (tenant_b), `henry.viewer@globaltech.io` / `tenant_a` (role: viewer).
- Per this project's standing convention: implementers stage changes with `git add` but never run `git commit` or `git push` — those commands are handed to the user to run themselves at the end of each task.
- K8s deploy steps run on the K8s master (`kubernetes-master`, repo cloned at `/home/motadata/itsm-cloudnative-demo-app`), not the local Mac — every task with a deploy step says so explicitly and gives copy-pasteable commands for the user to run there.

---

### Task 1: Redis session store (backend infra)

**Files:**
- Modify: `services/user-service/go.mod` (add `github.com/redis/go-redis/v9`)
- Modify: `services/user-service/internal/config/config.go` (add `RedisURL`, `SMTPHost` fields)
- Create: `services/user-service/internal/sessionstore/sessionstore.go`
- Test: `services/user-service/internal/sessionstore/sessionstore_test.go`

**Interfaces:**
- Produces: `sessionstore.New(redisURL string) (*sessionstore.Store, error)`; `(*Store).SaveSession(ctx, sessionID, userID, tenantSlug string, ttl time.Duration) error`; `(*Store).GetSession(ctx, sessionID string) (userID, tenantSlug string, err error)` (returns `sessionstore.ErrNotFound` if missing/expired); `(*Store).DeleteSession(ctx, sessionID string) error`; `(*Store).SaveOTP(ctx, tenantSlug, sessionID, code string, ttl time.Duration) error`; `(*Store).GetOTP(ctx, tenantSlug, sessionID string) (string, error)` (returns `ErrNotFound`); `(*Store).DeleteOTP(ctx, tenantSlug, sessionID string) error`; `(*Store).Close() error`. `config.Config` gains `RedisURL string` and `SMTPHost string` fields.

- [ ] **Step 1: Add the Redis dependency**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go get github.com/redis/go-redis/v9
```

- [ ] **Step 2: Write the failing test**

Create `services/user-service/internal/sessionstore/sessionstore_test.go`:

```go
package sessionstore

import (
	"context"
	"os"
	"testing"
	"time"
)

func testStore(t *testing.T) *Store {
	t.Helper()
	url := os.Getenv("REDIS_URL")
	if url == "" {
		t.Skip("REDIS_URL not set — skipping sessionstore integration test")
	}
	s, err := New(url)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestSaveAndGetSession(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-session-" + t.Name()

	if err := s.SaveSession(ctx, sessionID, "user-123", "tenant_a", time.Minute); err != nil {
		t.Fatalf("SaveSession() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteSession(ctx, sessionID) })

	userID, tenantSlug, err := s.GetSession(ctx, sessionID)
	if err != nil {
		t.Fatalf("GetSession() error = %v", err)
	}
	if userID != "user-123" || tenantSlug != "tenant_a" {
		t.Errorf("GetSession() = (%q, %q), want (%q, %q)", userID, tenantSlug, "user-123", "tenant_a")
	}
}

func TestGetSessionNotFound(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()

	_, _, err := s.GetSession(ctx, "nonexistent-session-id")
	if err != ErrNotFound {
		t.Errorf("GetSession() error = %v, want ErrNotFound", err)
	}
}

func TestSaveAndGetOTP(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-otp-session-" + t.Name()

	if err := s.SaveOTP(ctx, "tenant_a", sessionID, "123456", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteOTP(ctx, "tenant_a", sessionID) })

	code, err := s.GetOTP(ctx, "tenant_a", sessionID)
	if err != nil {
		t.Fatalf("GetOTP() error = %v", err)
	}
	if code != "123456" {
		t.Errorf("GetOTP() = %q, want %q", code, "123456")
	}
}

func TestDeleteOTPMakesItUnavailable(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-delete-otp-" + t.Name()

	if err := s.SaveOTP(ctx, "tenant_a", sessionID, "654321", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	if err := s.DeleteOTP(ctx, "tenant_a", sessionID); err != nil {
		t.Fatalf("DeleteOTP() error = %v", err)
	}

	_, err := s.GetOTP(ctx, "tenant_a", sessionID)
	if err != ErrNotFound {
		t.Errorf("GetOTP() after delete error = %v, want ErrNotFound", err)
	}
}
```

- [ ] **Step 2b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go test ./internal/sessionstore/... -v
```

Expected: `FAIL` — `New` / `ErrNotFound` / `Store` undefined (the package doesn't exist yet).

- [ ] **Step 3: Implement the session store**

Create `services/user-service/internal/sessionstore/sessionstore.go`:

```go
// Package sessionstore stores short-lived, pre-JWT authentication state
// (the pending-login session, and the email OTP for that session) in Redis.
package sessionstore

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// ErrNotFound is returned when a session or OTP key doesn't exist or has expired.
var ErrNotFound = errors.New("sessionstore: not found")

type Store struct {
	client *redis.Client
}

// New creates a Store from a "redis://host:port" (or "rediss://...") URL.
func New(redisURL string) (*Store, error) {
	addr := strings.TrimPrefix(redisURL, "redis://")
	addr = strings.TrimPrefix(addr, "rediss://")
	client := redis.NewClient(&redis.Options{Addr: addr})
	return &Store{client: client}, nil
}

func (s *Store) Close() error {
	return s.client.Close()
}

type pendingSession struct {
	UserID     string `json:"user_id"`
	TenantSlug string `json:"tenant_slug"`
}

func sessionKey(sessionID string) string {
	return "itsm:auth-session:" + sessionID
}

func otpKey(tenantSlug, sessionID string) string {
	return "itsm:" + tenantSlug + ":otp:" + sessionID
}

// SaveSession persists the pending-login user/tenant association, keyed by
// sessionID. Not tenant-scoped in its key — tenant isn't resolvable from any
// other request param at the mfa/send and mfa/verify call sites, so this
// record is the thing that resolves it.
func (s *Store) SaveSession(ctx context.Context, sessionID, userID, tenantSlug string, ttl time.Duration) error {
	rec := pendingSession{UserID: userID, TenantSlug: tenantSlug}
	data, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, sessionKey(sessionID), data, ttl).Err()
}

// GetSession returns the userID and tenantSlug associated with sessionID.
// Returns ErrNotFound if the session doesn't exist or has expired.
func (s *Store) GetSession(ctx context.Context, sessionID string) (userID, tenantSlug string, err error) {
	data, err := s.client.Get(ctx, sessionKey(sessionID)).Result()
	if errors.Is(err, redis.Nil) {
		return "", "", ErrNotFound
	}
	if err != nil {
		return "", "", err
	}
	var rec pendingSession
	if err := json.Unmarshal([]byte(data), &rec); err != nil {
		return "", "", err
	}
	return rec.UserID, rec.TenantSlug, nil
}

// DeleteSession removes the pending-login record.
func (s *Store) DeleteSession(ctx context.Context, sessionID string) error {
	return s.client.Del(ctx, sessionKey(sessionID)).Err()
}

// SaveOTP stores a one-time code for sessionID, scoped to tenantSlug.
func (s *Store) SaveOTP(ctx context.Context, tenantSlug, sessionID, code string, ttl time.Duration) error {
	return s.client.Set(ctx, otpKey(tenantSlug, sessionID), code, ttl).Err()
}

// GetOTP returns the stored code. Returns ErrNotFound if missing/expired.
func (s *Store) GetOTP(ctx context.Context, tenantSlug, sessionID string) (string, error) {
	code, err := s.client.Get(ctx, otpKey(tenantSlug, sessionID)).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return code, nil
}

// DeleteOTP removes the code — call this immediately after a successful
// match, since a code is single-use.
func (s *Store) DeleteOTP(ctx context.Context, tenantSlug, sessionID string) error {
	return s.client.Del(ctx, otpKey(tenantSlug, sessionID)).Err()
}
```

- [ ] **Step 4: Add `RedisURL` and `SMTPHost` to config**

Modify `services/user-service/internal/config/config.go`. In the `Config` struct (after line 22, `ServiceName string`), add:

```go
	RedisURL       string
	SMTPHost       string // empty = dev mode: OTP logged to stdout instead of emailed
```

In `Load()`'s struct literal (after line 32, `ServiceName: getEnvOrDefault("OTEL_SERVICE_NAME", "user-service"),`), add:

```go
		RedisURL:       os.Getenv("REDIS_URL"),
		SMTPHost:       getEnvOrDefault("SMTP_HOST", ""),
```

After the existing `if cfg.DatabaseURL == ""` check (line 37-39), add:

```go
	if cfg.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL is required")
	}
```

- [ ] **Step 5: Run to verify tests pass, against the live dev-cluster Redis**

The dev cluster's Redis is reachable at `redis.itsm-dev:6379` only from inside the cluster. Run this from the K8s master (or any machine with `kubectl port-forward` to it):

```bash
# On the K8s master, in a separate terminal, keep this running:
kubectl port-forward -n itsm-dev svc/redis 6379:6379
```

Then, in the repo (same or another shell with that port-forward active):

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
REDIS_URL="redis://localhost:6379" go test ./internal/sessionstore/... -v
```

Expected: all 4 tests `PASS`. If no port-forward is available in this environment, running `go build ./...` to confirm it compiles is the minimum bar — note this explicitly in the task report and flag it as a concern for the human to verify with live Redis before merging.

- [ ] **Step 6: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/go.mod services/user-service/go.sum services/user-service/internal/config/config.go services/user-service/internal/sessionstore/
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(user-service): add Redis session store for pending-login/OTP state"
```

---

### Task 2: OTel metrics pipeline (backend infra)

**Files:**
- Modify: `services/user-service/go.mod` (add OTel metric SDK + exporter packages)
- Modify: `services/user-service/telemetry/telemetry.go`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `telemetry.Init` now also calls `otel.SetMeterProvider(...)` internally — no signature change (`func Init(ctx context.Context, serviceName, endpoint, env string) (func(context.Context) error, error)`). Callers (Task 5's `main.go` changes) can call the package-level `otel.Meter(name)` the same way `main.go` already calls `otel.Tracer(name)`.

- [ ] **Step 1: Add the OTel metrics packages**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go get go.opentelemetry.io/otel/metric@v1.27.0
go get go.opentelemetry.io/otel/sdk/metric@v1.27.0
go get go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc
go mod tidy
```

`go mod tidy` resolves the exact compatible `otlpmetricgrpc` version against the pinned `v1.27.0` core packages — do not hand-pick that version number.

- [ ] **Step 2: Verify the build still compiles (no behavior change yet)**

```bash
go build ./...
```

Expected: succeeds (the new packages are now dependencies but nothing imports them yet).

- [ ] **Step 3: Extend `telemetry.Init` to also set up a `MeterProvider`**

Replace the full contents of `services/user-service/telemetry/telemetry.go`:

```go
// Package telemetry initialises OpenTelemetry for the user-service.
// Call Init() once at startup and defer the returned shutdown function.
//
// What is set up:
//   - OTLP gRPC trace exporter → OTel Collector (TracerProvider)
//   - OTLP gRPC metric exporter → OTel Collector (MeterProvider)
//   - W3C TraceContext + Baggage propagators (required for Istio header propagation)
//   - Both providers registered globally so otelhttp middleware, otel.Tracer(),
//     and otel.Meter() calls anywhere in the service share this setup.
package telemetry

import (
	"context"
	"errors"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Init sets up the global TracerProvider and MeterProvider and returns a
// shutdown function.
// endpoint: OTel Collector gRPC address, e.g. "otel-collector.itsm-dev:4317"
// serviceName: value of OTEL_SERVICE_NAME, e.g. "user-service"
// env: "dev" or "qa"
func Init(ctx context.Context, serviceName, endpoint, env string) (func(context.Context) error, error) {
	conn, err := grpc.NewClient(endpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("dial otel collector %s: %w", endpoint, err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironment(env),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("create otel resource: %w", err)
	}

	// ── Traces ──────────────────────────────────────────────────────────────
	traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("create otlp trace exporter: %w", err)
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(res),
		// Sample everything in dev; switch to ParentBased(TraceIDRatioBased) in production.
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	otel.SetTracerProvider(tp)

	// ── Metrics ─────────────────────────────────────────────────────────────
	metricExporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("create otlp metric exporter: %w", err)
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	// W3C TraceContext + Baggage — Istio Envoy propagates traceparent automatically
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	shutdown := func(ctx context.Context) error {
		var errs []error
		if err := tp.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("tracer provider shutdown: %w", err))
		}
		if err := mp.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("meter provider shutdown: %w", err))
		}
		if err := conn.Close(); err != nil {
			errs = append(errs, fmt.Errorf("grpc conn close: %w", err))
		}
		return errors.Join(errs...)
	}

	return shutdown, nil
}
```

- [ ] **Step 4: Verify it builds**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

Expected: succeeds. There is no meaningful unit test for `Init` itself — it's a thin wiring function whose real behavior (does it actually emit metrics/traces) is exercised by Task 7's live-cluster OTel sanity check (spec §7, test 6), not by a unit test here. Do not invent a mock-collector unit test for this step — that would be scope creep the plan doesn't call for.

- [ ] **Step 5: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/go.mod services/user-service/go.sum services/user-service/telemetry/telemetry.go
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(user-service): add OTel MeterProvider alongside existing TracerProvider"
```

---

### Task 3: Login handler — mfa_required flow

**Files:**
- Modify: `services/user-service/internal/models/user.go`
- Modify: `services/user-service/internal/handlers/auth.go`
- Test: `services/user-service/internal/handlers/auth_test.go` (created here, extended in Tasks 4 and 5)

**Interfaces:**
- Consumes: `sessionstore.New`, `(*sessionstore.Store).SaveSession` (Task 1); `otel.Meter` availability (Task 2).
- Produces: `models.MfaRequiredResponse{MfaRequired bool, SessionID string}`. `handlers.NewAuthHandler(repo *repository.Repo, cfg *config.Config, tracer trace.Tracer, meter metric.Meter, store *sessionstore.Store) (*AuthHandler, error)` — signature change from the current `NewAuthHandler(repo, cfg, tracer) *AuthHandler` (no error return). `AuthHandler.Login` now returns `202`-shaped `MfaRequiredResponse` instead of issuing a token directly. Later tasks (4, 5) add `AuthHandler.MfaSend` and `AuthHandler.MfaVerify` to the same handler struct and consume `h.store`, `h.loginAttempts`/`h.mfaOtpSent`/`h.mfaVerifyAttempts` counter fields.

- [ ] **Step 1: Add the new response/request models**

Modify `services/user-service/internal/models/user.go`. After the existing `LoginResponse` struct (lines 52-56), add:

```go
// MfaRequiredResponse is returned by Login on valid credentials — no token
// yet, the caller must complete POST /api/v1/auth/mfa/send + /mfa/verify.
type MfaRequiredResponse struct {
	MfaRequired bool   `json:"mfa_required"`
	SessionID   string `json:"session_id"`
}

type MfaSendRequest struct {
	SessionID string `json:"session_id"`
}

type MfaVerifyRequest struct {
	SessionID string `json:"session_id"`
	Code      string `json:"code"`
}
```

- [ ] **Step 2: Write the failing tests**

Create `services/user-service/internal/handlers/auth_test.go`:

```go
package handlers

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/config"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
	"go.opentelemetry.io/otel"
)

// testHandler builds a real AuthHandler against the live DATABASE_URL and
// REDIS_URL. Skips if either is unset — see Global Constraints for why this
// codebase doesn't mock the DB/Redis layer for handler tests.
func testHandler(t *testing.T) *AuthHandler {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	redisURL := os.Getenv("REDIS_URL")
	if dbURL == "" || redisURL == "" {
		t.Skip("DATABASE_URL and REDIS_URL must be set — skipping integration test")
	}

	ctx := context.Background()
	pool, err := appdb.NewPool(ctx, dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate rsa key: %v", err)
	}

	store, err := sessionstore.New(redisURL)
	if err != nil {
		t.Fatalf("session store: %v", err)
	}
	t.Cleanup(func() { store.Close() })

	cfg := &config.Config{
		JWTPrivateKey:  key,
		JWTExpiryHours: 24,
	}
	tracer := otel.Tracer("test")
	meter := otel.Meter("test")

	h, err := NewAuthHandler(repository.New(pool), cfg, tracer, meter, store)
	if err != nil {
		t.Fatalf("NewAuthHandler: %v", err)
	}
	return h
}

func TestLoginReturnsMfaRequired(t *testing.T) {
	h := testHandler(t)

	body, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login() status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
	var resp models.MfaRequiredResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !resp.MfaRequired {
		t.Error("MfaRequired = false, want true")
	}
	if resp.SessionID == "" {
		t.Error("SessionID is empty")
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	h := testHandler(t)

	body, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "wrong-password",
		TenantSlug: "tenant_a",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Login() status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
```

- [ ] **Step 2b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

Expected: `FAIL` — compile error, `NewAuthHandler` signature mismatch (test calls it with 5 args including `meter`; current code takes 3 and returns no error) and `models.MfaRequiredResponse` undefined.

- [ ] **Step 3: Update `NewAuthHandler` and `Login`**

Modify `services/user-service/internal/handlers/auth.go`. Update the imports block (lines 1-20) to:

```go
package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/crypto/bcrypt"

	"github.com/itsm-cloudnative/user-service/internal/config"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
)
```

(`fmt`, `metric`, and `sessionstore` are new in this task; everything else is unchanged from the current file. Do NOT add `crypto/rand` or `math/big` yet — those are only needed once `generateOTP` is added in Task 4, and an unused import is a compile error in Go. Task 4's Step 2 adds them when they're actually used.)

Replace the `AuthHandler` struct and `NewAuthHandler` (current lines 33-42):

```go
// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	repo   *repository.Repo
	cfg    *config.Config
	tracer trace.Tracer
	store  *sessionstore.Store

	loginAttempts     metric.Int64Counter
	mfaOtpSent        metric.Int64Counter
	mfaVerifyAttempts metric.Int64Counter
}

func NewAuthHandler(repo *repository.Repo, cfg *config.Config, tracer trace.Tracer, meter metric.Meter, store *sessionstore.Store) (*AuthHandler, error) {
	loginAttempts, err := meter.Int64Counter(
		"itsm_login_attempts_total",
		metric.WithDescription("Login attempts by result"),
	)
	if err != nil {
		return nil, fmt.Errorf("create itsm_login_attempts_total counter: %w", err)
	}
	mfaOtpSent, err := meter.Int64Counter(
		"itsm_mfa_otp_sent_total",
		metric.WithDescription("MFA OTP codes sent"),
	)
	if err != nil {
		return nil, fmt.Errorf("create itsm_mfa_otp_sent_total counter: %w", err)
	}
	mfaVerifyAttempts, err := meter.Int64Counter(
		"itsm_mfa_verify_attempts_total",
		metric.WithDescription("MFA verification attempts by result"),
	)
	if err != nil {
		return nil, fmt.Errorf("create itsm_mfa_verify_attempts_total counter: %w", err)
	}

	return &AuthHandler{
		repo:              repo,
		cfg:               cfg,
		tracer:            tracer,
		store:             store,
		loginAttempts:     loginAttempts,
		mfaOtpSent:        mfaOtpSent,
		mfaVerifyAttempts: mfaVerifyAttempts,
	}, nil
}
```

Replace the `Login` handler (current lines 44-109, from `// Login authenticates...` through the closing `}` of the function) with:

```go
// Login validates credentials and starts the MFA step — it does NOT issue a
// JWT. On success, call POST /api/v1/auth/mfa/send with the returned
// session_id, then POST /api/v1/auth/mfa/verify with the emailed code.
//
// POST /api/v1/auth/login
// Body: { "email": "...", "password": "...", "tenant_slug": "tenant_a" }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.login")
	defer span.End()

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.TenantSlug == "" {
		writeError(w, http.StatusBadRequest, "email, password, and tenant_slug are required")
		return
	}

	span.SetAttributes(
		attribute.String("tenant.id", req.TenantSlug),
		attribute.String("user.email", req.Email),
	)

	user, err := h.repo.FindByEmail(ctx, req.TenantSlug, req.Email)
	if errors.Is(err, repository.ErrNotFound) {
		span.SetStatus(codes.Error, "user not found")
		h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", req.TenantSlug),
			attribute.String("result", "invalid_credentials"),
		))
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if !user.IsActive {
		span.SetStatus(codes.Error, "user inactive")
		h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", req.TenantSlug),
			attribute.String("result", "inactive_account"),
		))
		writeError(w, http.StatusUnauthorized, "account is inactive")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		span.SetStatus(codes.Error, "wrong password")
		h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", req.TenantSlug),
			attribute.String("result", "invalid_credentials"),
		))
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	sessionID := uuid.New().String()
	if err := h.store.SaveSession(ctx, sessionID, user.ID.String(), req.TenantSlug, 10*time.Minute); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "session store failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.role", user.Role))
	span.AddEvent("credentials_valid")
	h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
		attribute.String("tenant", req.TenantSlug),
		attribute.String("result", "success"),
	))

	writeJSON(w, http.StatusOK, &models.MfaRequiredResponse{
		MfaRequired: true,
		SessionID:   sessionID,
	})
}
```

Leave `Refresh` (current lines ~111-163) and the `// ── helpers ──` section (current lines 165-207: `issueToken`, `extractBearerToken`, `mustParseUUID`) completely unchanged — `issueToken` gets a new caller in Task 5, nothing about it changes.

- [ ] **Step 4: Verify the two new tests pass, the rest of the package still compiles**

Run with the same Redis port-forward as Task 1 Step 5 active:

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
DATABASE_URL="<the live dev-cluster DATABASE_URL — get it via: kubectl get secret itsm-secrets -n itsm-dev -o jsonpath='{.data.database-url}' | base64 -d>" \
REDIS_URL="redis://localhost:6379" \
go test ./internal/handlers/... -run 'TestLogin' -v
```

Expected: `TestLoginReturnsMfaRequired` and `TestLoginInvalidCredentials` both `PASS`.

- [ ] **Step 5: Update `main.go`'s call site so the whole service still builds**

This is required for `go build ./...` to succeed even though Task 5 finishes wiring `main.go` properly — do the minimal change now so the build isn't broken mid-plan. Modify `services/user-service/cmd/main.go`. Change line 83 from:

```go
	authH := handlers.NewAuthHandler(repo, cfg, tracer)
```

to:

```go
	authH, err := handlers.NewAuthHandler(repo, cfg, tracer, otel.Meter(cfg.ServiceName), nil) // store wired in Task 5
	if err != nil {
		return fmt.Errorf("auth handler: %w", err)
	}
```

This is intentionally a temporary stub (`nil` store, noted in the plan for Task 5 to complete) — `go vet`/`go build` will pass since `Login` doesn't get called by anything except tests until the service actually runs, and Task 5 replaces this line properly.

- [ ] **Step 6: Verify full build**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

Expected: succeeds.

- [ ] **Step 7: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/internal/models/user.go services/user-service/internal/handlers/auth.go services/user-service/internal/handlers/auth_test.go services/user-service/cmd/main.go
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(user-service): Login returns mfa_required + session_id instead of issuing a token directly"
```

---

### Task 4: `mfa/send` handler

**Files:**
- Modify: `services/user-service/internal/config/config.go` is already done (Task 1) — no change here.
- Modify: `services/user-service/internal/handlers/auth.go`
- Modify: `services/user-service/internal/handlers/auth_test.go`

**Interfaces:**
- Consumes: `h.store.GetSession` (Task 1), `h.repo.FindByID(ctx, tenantSlug, uuid.UUID) (*models.User, error)` (already exists in `repository.Repo` — verified present), `models.MfaSendRequest` (Task 3), `h.cfg.SMTPHost` (Task 1).
- Produces: `AuthHandler.MfaSend(w http.ResponseWriter, r *http.Request)`, registered at `POST /api/v1/auth/mfa/send` (route wiring happens in Task 5's `main.go` change, not here — this task only adds the handler method + its tests).

- [ ] **Step 1: Extend the test file with the failing test**

Append to `services/user-service/internal/handlers/auth_test.go` (add these two functions after `TestLoginInvalidCredentials`):

```go
func TestMfaSendSucceedsAfterLogin(t *testing.T) {
	h := testHandler(t)

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	if err := json.NewDecoder(loginW.Body).Decode(&loginResp); err != nil {
		t.Fatalf("decode login response: %v", err)
	}

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	sendW := httptest.NewRecorder()

	h.MfaSend(sendW, sendReq)

	if sendW.Code != http.StatusOK {
		t.Fatalf("MfaSend() status = %d, want %d, body = %s", sendW.Code, http.StatusOK, sendW.Body.String())
	}

	// The OTP must actually have been written to the store.
	code, err := h.store.GetOTP(context.Background(), "tenant_a", loginResp.SessionID)
	if err != nil {
		t.Fatalf("GetOTP() after MfaSend error = %v", err)
	}
	if len(code) != 6 {
		t.Errorf("stored OTP length = %d, want 6", len(code))
	}
}

func TestMfaSendUnknownSession(t *testing.T) {
	h := testHandler(t)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: "nonexistent-session-id"})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	sendW := httptest.NewRecorder()

	h.MfaSend(sendW, sendReq)

	if sendW.Code != http.StatusUnauthorized {
		t.Errorf("MfaSend() with unknown session status = %d, want %d", sendW.Code, http.StatusUnauthorized)
	}
}

func TestGenerateOTPFormat(t *testing.T) {
	code, err := generateOTP()
	if err != nil {
		t.Fatalf("generateOTP() error = %v", err)
	}
	if len(code) != 6 {
		t.Errorf("generateOTP() len = %d, want 6", len(code))
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			t.Errorf("generateOTP() = %q, contains non-digit character %q", code, c)
			break
		}
	}
}
```

- [ ] **Step 1b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

Expected: `FAIL` — compile error, `h.MfaSend` and `generateOTP` undefined.

- [ ] **Step 2: Implement `generateOTP` and `MfaSend`**

Modify `services/user-service/internal/handlers/auth.go`. In the imports block, add `"log/slog"` (it's not there yet — the file currently has no logging). The full import block becomes:

```go
package handlers

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/crypto/bcrypt"

	"github.com/itsm-cloudnative/user-service/internal/config"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
)
```

Add the `MfaSend` handler right after `Login` (before `Refresh`):

```go
// MfaSend generates and sends (or, in dev mode, logs) a one-time email code
// for the session started by Login.
//
// POST /api/v1/auth/mfa/send
// Body: { "session_id": "..." }
func (h *AuthHandler) MfaSend(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.mfa_send")
	defer span.End()

	var req models.MfaSendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.SessionID == "" {
		writeError(w, http.StatusBadRequest, "session_id is required")
		return
	}

	userID, tenantSlug, err := h.store.GetSession(ctx, req.SessionID)
	if errors.Is(err, sessionstore.ErrNotFound) {
		span.SetStatus(codes.Error, "session not found")
		writeError(w, http.StatusUnauthorized, "invalid or expired session")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "session store error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	user, err := h.repo.FindByID(ctx, tenantSlug, mustParseUUID(userID))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "user lookup failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(
		attribute.String("tenant.id", tenantSlug),
		attribute.String("user.role", user.Role),
	)

	code, err := generateOTP()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "otp generation failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := h.store.SaveOTP(ctx, tenantSlug, req.SessionID, code, 5*time.Minute); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "otp store failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if h.cfg.SMTPHost == "" {
		// Dev mode — no real email provider. This log line IS the delivery
		// mechanism for local/dev-cluster testing (see design spec §4).
		slog.Info("dev-mode: MFA OTP generated", "tenant", tenantSlug, "email", user.Email, "code", code)
	}
	// else: real SMTP send — explicitly out of scope for Sprint 1 (design spec §8 non-goals).

	h.mfaOtpSent.Add(ctx, 1, metric.WithAttributes(attribute.String("tenant", tenantSlug)))

	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}
```

Add `generateOTP` to the `// ── helpers ──` section, after `mustParseUUID`:

```go
// generateOTP returns a cryptographically random 6-digit numeric code,
// zero-padded (e.g. "004821").
func generateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
```

- [ ] **Step 3: Verify tests pass**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
DATABASE_URL="<same as Task 3 Step 4>" \
REDIS_URL="redis://localhost:6379" \
go test ./internal/handlers/... -run 'TestMfaSend|TestGenerateOTP' -v
```

Expected: all 3 tests `PASS`.

- [ ] **Step 4: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/internal/handlers/auth.go services/user-service/internal/handlers/auth_test.go
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(user-service): add POST /api/v1/auth/mfa/send"
```

---

### Task 5: `mfa/verify` handler + route wiring

**Files:**
- Modify: `services/user-service/internal/handlers/auth.go`
- Modify: `services/user-service/internal/handlers/auth_test.go`
- Modify: `services/user-service/cmd/main.go`

**Interfaces:**
- Consumes: `h.store.GetOTP`/`DeleteOTP`/`DeleteSession` (Task 1), `h.issueToken` (existing, unchanged), `models.MfaVerifyRequest` (Task 3), `models.LoginResponse` (existing, unchanged shape).
- Produces: `AuthHandler.MfaVerify(w http.ResponseWriter, r *http.Request)`, registered at `POST /api/v1/auth/mfa/verify`. `main.go` now correctly wires a real `sessionstore.Store` (replacing Task 3 Step 5's temporary `nil`) and registers both new routes.

- [ ] **Step 1: Extend the test file with the failing tests**

Append to `services/user-service/internal/handlers/auth_test.go`:

```go
func TestMfaVerifyFullFlowSucceeds(t *testing.T) {
	h := testHandler(t)
	ctx := context.Background()

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	json.NewDecoder(loginW.Body).Decode(&loginResp)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	h.MfaSend(httptest.NewRecorder(), sendReq)

	code, err := h.store.GetOTP(ctx, "tenant_a", loginResp.SessionID)
	if err != nil {
		t.Fatalf("GetOTP() error = %v", err)
	}

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: loginResp.SessionID, Code: code})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusOK {
		t.Fatalf("MfaVerify() status = %d, want %d, body = %s", verifyW.Code, http.StatusOK, verifyW.Body.String())
	}
	var verifyResp models.LoginResponse
	if err := json.NewDecoder(verifyW.Body).Decode(&verifyResp); err != nil {
		t.Fatalf("decode verify response: %v", err)
	}
	if verifyResp.Token == "" {
		t.Error("Token is empty")
	}
	if verifyResp.User == nil || verifyResp.User.Email != "alice.admin@globaltech.io" {
		t.Errorf("User = %+v, want email alice.admin@globaltech.io", verifyResp.User)
	}

	// Single-use: verifying again with the same (now-deleted) code must fail.
	verifyAgainReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyAgainW := httptest.NewRecorder()
	h.MfaVerify(verifyAgainW, verifyAgainReq)
	if verifyAgainW.Code != http.StatusUnauthorized {
		t.Errorf("second MfaVerify() with same code status = %d, want %d", verifyAgainW.Code, http.StatusUnauthorized)
	}
}

func TestMfaVerifyWrongCode(t *testing.T) {
	h := testHandler(t)

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	json.NewDecoder(loginW.Body).Decode(&loginResp)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	h.MfaSend(httptest.NewRecorder(), sendReq)

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: loginResp.SessionID, Code: "000000"})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusUnauthorized {
		t.Errorf("MfaVerify() with wrong code status = %d, want %d", verifyW.Code, http.StatusUnauthorized)
	}
}

func TestMfaVerifyUnknownSession(t *testing.T) {
	h := testHandler(t)

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: "nonexistent-session", Code: "123456"})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusUnauthorized {
		t.Errorf("MfaVerify() with unknown session status = %d, want %d", verifyW.Code, http.StatusUnauthorized)
	}
}
```

- [ ] **Step 1b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

Expected: `FAIL` — `h.MfaVerify` undefined.

- [ ] **Step 2: Implement `MfaVerify`**

Modify `services/user-service/internal/handlers/auth.go`. Add the `MfaVerify` handler right after `MfaSend` (before `Refresh`):

```go
// MfaVerify checks the one-time code and, on success, issues the real JWT —
// this is the actual "fully authenticated" moment (Login only validated
// credentials; MfaSend only sent a code).
//
// POST /api/v1/auth/mfa/verify
// Body: { "session_id": "...", "code": "123456" }
func (h *AuthHandler) MfaVerify(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.mfa_verify")
	defer span.End()

	var req models.MfaVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.SessionID == "" || req.Code == "" {
		writeError(w, http.StatusBadRequest, "session_id and code are required")
		return
	}

	userID, tenantSlug, err := h.store.GetSession(ctx, req.SessionID)
	if errors.Is(err, sessionstore.ErrNotFound) {
		span.SetStatus(codes.Error, "session not found")
		h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", "unknown"),
			attribute.String("result", "expired"),
		))
		writeError(w, http.StatusUnauthorized, "invalid or expired session")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "session store error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("tenant.id", tenantSlug))

	storedCode, err := h.store.GetOTP(ctx, tenantSlug, req.SessionID)
	if errors.Is(err, sessionstore.ErrNotFound) {
		span.SetStatus(codes.Error, "otp expired")
		h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", tenantSlug),
			attribute.String("result", "expired"),
		))
		writeError(w, http.StatusUnauthorized, "code expired — request a new one")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "otp store error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if storedCode != req.Code {
		span.SetStatus(codes.Error, "wrong code")
		h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("tenant", tenantSlug),
			attribute.String("result", "invalid_code"),
		))
		writeError(w, http.StatusUnauthorized, "invalid code")
		return
	}

	// Single-use — delete immediately after a correct match, before doing
	// anything else that could fail and leave a valid code reusable.
	if err := h.store.DeleteOTP(ctx, tenantSlug, req.SessionID); err != nil {
		span.RecordError(err) // non-fatal — log via span, continue
	}

	user, err := h.repo.FindByID(ctx, tenantSlug, mustParseUUID(userID))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "user lookup failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	token, expiresAt, err := h.issueToken(user, tenantSlug)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "token issue failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := h.store.DeleteSession(ctx, req.SessionID); err != nil {
		span.RecordError(err) // non-fatal — token already issued
	}

	span.SetAttributes(attribute.String("user.role", user.Role))
	span.AddEvent("mfa_verify_success")
	h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
		attribute.String("tenant", tenantSlug),
		attribute.String("result", "success"),
	))

	writeJSON(w, http.StatusOK, &models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user.ToResponse(),
	})
}
```

- [ ] **Step 3: Wire the real session store and both new routes into `main.go`**

Modify `services/user-service/cmd/main.go`. Add the import (in the existing import block, after `"github.com/itsm-cloudnative/user-service/internal/repository"`):

```go
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
```

Add session-store construction right after the database pool setup (after the existing `slog.Info("database connected")` line):

```go
	// ── Session store (Redis) ────────────────────────────────────────────────
	sessStore, err := sessionstore.New(cfg.RedisURL)
	if err != nil {
		return fmt.Errorf("session store: %w", err)
	}
	defer sessStore.Close()
```

Replace the Task 3 Step 5 temporary line:

```go
	authH, err := handlers.NewAuthHandler(repo, cfg, tracer, otel.Meter(cfg.ServiceName), nil) // store wired in Task 5
	if err != nil {
		return fmt.Errorf("auth handler: %w", err)
	}
```

with the final version:

```go
	authH, err := handlers.NewAuthHandler(repo, cfg, tracer, otel.Meter(cfg.ServiceName), sessStore)
	if err != nil {
		return fmt.Errorf("auth handler: %w", err)
	}
```

Update the auth routes block (currently):

```go
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/login", authH.Login)
		r.Post("/refresh", authH.Refresh)
	})
```

to:

```go
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/login", authH.Login)
		r.Post("/refresh", authH.Refresh)
		r.Post("/mfa/send", authH.MfaSend)
		r.Post("/mfa/verify", authH.MfaVerify)
	})
```

- [ ] **Step 4: Verify tests pass and the full service builds**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
DATABASE_URL="<same as Task 3 Step 4>" \
REDIS_URL="redis://localhost:6379" \
go test ./... -v
go build ./...
go vet ./...
```

Expected: every test `PASS` (across `sessionstore` and `handlers` packages), clean build, no vet issues.

- [ ] **Step 5: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/internal/handlers/auth.go services/user-service/internal/handlers/auth_test.go services/user-service/cmd/main.go
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(user-service): add POST /api/v1/auth/mfa/verify, wire session store + routes in main.go"
```

---

### Task 6: OPA policy — public-path exemptions for MFA endpoints

**Files:**
- Modify: `infra/k8s/opa/policy-configmap.yaml`

**Interfaces:** none (Rego config only).

- [ ] **Step 1: Add the two new `public if` rules**

Modify `infra/k8s/opa/policy-configmap.yaml`. In the Rego policy's `# ── Public paths` section, currently:

```rego
    # ── Public paths — allow without JWT ──────────────────────────────────────
    # Login endpoint
    public if { path == "/api/v1/auth/login" }
    # JWKS endpoint (Istio fetches this)
    public if { startswith(path, "/api/v1/.well-known/") }
```

change to:

```rego
    # ── Public paths — allow without JWT ──────────────────────────────────────
    # Login endpoint
    public if { path == "/api/v1/auth/login" }
    # MFA endpoints — a user has no JWT yet at this point in the flow
    public if { path == "/api/v1/auth/mfa/send" }
    public if { path == "/api/v1/auth/mfa/verify" }
    # JWKS endpoint (Istio fetches this)
    public if { startswith(path, "/api/v1/.well-known/") }
```

Everything else in the file (`Health checks`, `non-API paths`, the `admin`/`agent`/`viewer` role rules) is unchanged.

- [ ] **Step 2: Deploy the updated policy to itsm-dev**

Give the user these commands to run on the K8s master:

```bash
cd /home/motadata/itsm-cloudnative-demo-app
git pull
kubectl apply -f infra/k8s/opa/policy-configmap.yaml
kubectl rollout restart deployment/opa -n itsm-dev
kubectl rollout status deployment/opa -n itsm-dev
```

- [ ] **Step 3: Verify with a live curl smoke test**

Give the user this command to run on the K8s master, once OPA has finished rolling out (this hits the endpoints with no JWT — the whole point of the exemption — using a `session_id` that won't resolve to anything real, so a `401` from the *handler* is the correct/expected result; the thing being verified here is that OPA itself does NOT return `403` first):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://172.16.15.206:30080/api/v1/auth/mfa/send \
  -H "Content-Type: application/json" -d '{"session_id":"smoke-test"}'
```

Expected: `401` (from the handler's "invalid or expired session" — NOT `403`, which would mean OPA is still blocking it). If this returns `403`, stop and report — it means the ConfigMap update or rollout didn't take effect and the policy needs re-checking before continuing.

- [ ] **Step 4: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add infra/k8s/opa/policy-configmap.yaml
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(opa): exempt /api/v1/auth/mfa/send and /mfa/verify from JWT requirement"
```

---

### Task 7: Backend version bump, image build, and deploy to itsm-dev

**Files:**
- Modify: `services/user-service/VERSION`
- Modify: `services/user-service/CHANGELOG.md`
- Modify: `infra/helm/itsm-app/templates/user-service/deployment.yaml` (add `REDIS_URL` env var)
- Modify: `infra/helm/itsm-app/values.yaml` (bump `userService.image.tag`)

**Interfaces:** none — this is a packaging/deploy task, no code interfaces produced.

- [ ] **Step 1: Bump `VERSION` and update `CHANGELOG.md`**

Modify `services/user-service/VERSION` — change its contents from `0.2.0` to:

```
0.4.0
```

Modify `services/user-service/CHANGELOG.md`. The current file has:

```markdown
## [Unreleased]

### Planned (v0.3.0 — Phase 6)
- RS256 JWT signing — private key loaded from `JWT_PRIVATE_KEY` env var
- JWKS endpoint updated to serve RSA public key (`kty: RSA`) for Istio RequestAuthentication
- `iss` claim added to JWT payload (`itsm-user-service`)

### Planned (v0.4.0 — Sprint 1)
- `POST /api/v1/auth/mfa/send` — generate email OTP, store in Redis (5 min TTL), send via SMTP
- `POST /api/v1/auth/mfa/verify` — validate OTP, issue JWT on success
- Login response updated: returns `{"mfa_required": true, "session_id": "..."}` before OTP step
- SMTP sender with dev-mode fallback (logs OTP to stdout when `SMTP_HOST` unset)

---

## [0.2.0] - 2026-04-20
```

Replace the `## [Unreleased]` section (everything from `## [Unreleased]` down to, but not including, `## [0.2.0]`) with:

```markdown
## [Unreleased]

---

## [0.4.0] - 2026-07-09

### Added (Sprint 1)
- `POST /api/v1/auth/mfa/send` — generates a 6-digit email OTP, stores it in Redis (`itsm:{tenant_slug}:otp:{session_id}`, 5 min TTL); logs the code to stdout in dev mode (`SMTP_HOST` unset) rather than sending real email
- `POST /api/v1/auth/mfa/verify` — validates the OTP, issues the RS256 JWT on success (single-use code, deleted immediately on a correct match)
- `POST /api/v1/auth/login` now returns `{"mfa_required": true, "session_id": "..."}` instead of issuing a token directly — the pending-login user/tenant association is stored at `itsm:auth-session:{session_id}` (10 min TTL)
- New `itsm.user.mfa_send` and `itsm.user.mfa_verify` OTel spans (`tenant.id`, `user.role` attributes)
- New OTel metrics: `itsm_login_attempts_total{tenant, result}`, `itsm_mfa_otp_sent_total{tenant}`, `itsm_mfa_verify_attempts_total{tenant, result}` — first metrics in this service; `telemetry.Init` now also registers a `MeterProvider`
- New `REDIS_URL` (required) and `SMTP_HOST` (optional, empty = dev mode) environment variables

### Changed
- `itsm.user.login` span's `login_success` event renamed to `credentials_valid` — the true "fully authenticated" event is now `mfa_verify_success` on the new `itsm.user.mfa_verify` span

---

## [0.3.0] - 2026-07-08

### Added (Phase 6 — Istio + OPA, retroactively documented; this work shipped before this CHANGELOG entry was written)
- RS256 JWT signing — private key loaded from `JWT_PRIVATE_KEY` env var
- JWKS endpoint updated to serve RSA public key (`kty: RSA`) for Istio RequestAuthentication
- `iss` claim added to JWT payload (`itsm-user-service`)

---

## [0.2.0] - 2026-04-20
```

- [ ] **Step 2: Add `REDIS_URL` to the Helm deployment template**

Modify `infra/helm/itsm-app/templates/user-service/deployment.yaml`. In the `env:` block, after the existing `JWT_PRIVATE_KEY` secret entry:

```yaml
            - name: JWT_PRIVATE_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.userService.secretName }}
                  key: jwt-private-key
```

add:

```yaml
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.userService.secretName }}
                  key: redis-url
```

(The `redis-url` key already exists in the live `itsm-secrets` K8s secret — confirmed present earlier this session — no secret changes needed, only this env-var mapping.)

- [ ] **Step 3: Bump the image tag in `values.yaml`**

Modify `infra/helm/itsm-app/values.yaml`. Change:

```yaml
    tag: "v0.3.0"               # Phase 6: RS256 migration
```

to:

```yaml
    tag: "v0.4.0"               # Sprint 1: email OTP MFA
```

(Leave `pullPolicy: IfNotPresent` as-is — this is a fresh, never-before-pushed tag, so there's no stale-cache risk the way `latest` had earlier this session.)

- [ ] **Step 4: Verify locally that the module still builds clean with the version-only changes**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/user-service"
go build ./...
```

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
helm template itsm-app ./infra/helm/itsm-app -f infra/helm/itsm-app/values.yaml -s templates/user-service/deployment.yaml
```

Expected: `go build` succeeds; the rendered Helm template shows `image: "preet2fun/user-service:v0.4.0"` and a `REDIS_URL` env entry sourced from `redis-url`.

- [ ] **Step 5: Stage locally, then hand off both the local commit and the cluster deploy commands**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/user-service/VERSION services/user-service/CHANGELOG.md infra/helm/itsm-app/templates/user-service/deployment.yaml infra/helm/itsm-app/values.yaml
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "chore(user-service): bump to v0.4.0 for Sprint 1 MFA, wire REDIS_URL in Helm"
git push
```

Then give the user these commands to run on the K8s master, **after** they've pushed:

```bash
cd /home/motadata/itsm-cloudnative-demo-app
git pull
cd services/user-service
docker build -t preet2fun/user-service:v0.4.0 .
docker push preet2fun/user-service:v0.4.0
cd /home/motadata/itsm-cloudnative-demo-app

helm upgrade --install itsm-app ./infra/helm/itsm-app -f infra/helm/itsm-app/values.yaml -n itsm-dev
kubectl rollout restart deployment/user-service -n itsm-dev
kubectl rollout status deployment/user-service -n itsm-dev
kubectl get pods -n itsm-dev -o wide
```

Expected: `user-service` pod comes up `2/2 Running`, no crash loop (same failure modes as earlier this session — `ErrImagePull` from a stale tag reference, or a missing env var — are the things to watch for if this doesn't come up clean).

- [ ] **Step 6: Live smoke test of the full backend flow**

Give the user this to run on the K8s master (real login → real OTP printed in the pod's own logs → real verify):

```bash
LOGIN_RESP=$(curl -s -X POST http://172.16.15.206:30080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.admin@globaltech.io","password":"Password1!","tenant_slug":"tenant_a"}')
echo "$LOGIN_RESP" | python3 -m json.tool
SESSION_ID=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['session_id'])")

curl -s -X POST http://172.16.15.206:30080/api/v1/auth/mfa/send \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"${SESSION_ID}\"}"

echo ""
echo "Find the OTP in the pod logs:"
kubectl logs -n itsm-dev -l app=user-service -c user-service --tail=20 | grep "dev-mode: MFA OTP"
```

Then, using the code printed in the logs:

```bash
CODE="<paste the code from the log line above>"
curl -s -X POST http://172.16.15.206:30080/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"${SESSION_ID}\",\"code\":\"${CODE}\"}" | python3 -m json.tool
```

Expected: the final response is `{"token": "...", "expires_at": "...", "user": {...}}` — a real JWT. Paste all of this output back for review before moving to the frontend tasks.

---

### Task 8: Frontend test infra + TanStack Query (infra)

**Files:**
- Modify: `services/frontend/package.json`
- Create: `services/frontend/vitest.config.ts`
- Create: `services/frontend/src/test/setup.ts`

**Interfaces:**
- Produces: `vitest` CLI runnable via `npm test`; `@testing-library/react`'s `render`/`screen`/`fireEvent` importable in any `*.test.tsx` file; `@tanstack/react-query`'s `QueryClient`/`QueryClientProvider`/`useMutation` importable for Task 9+.

- [ ] **Step 1: Add the new dependencies**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm install @tanstack/react-query
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Add the `test` script, and fix `type-check` (it currently silently no-ops)**

`services/frontend/tsconfig.json` is a solution-style config (`"files": []`, with `references` to `tsconfig.app.json`/`tsconfig.node.json`). The existing `type-check` script runs plain `tsc --noEmit`, which resolves against that root config — with `files: []` and no `-b` (build/reference-following) flag, this silently checks nothing and always exits `0`, even with a real type error present. Confirmed by directly testing it against this repo: injecting an obvious type error into `App.tsx` and running the current script still exits clean; running `tsc --noEmit -p tsconfig.app.json` against the same broken file correctly reports the error. Every later task in this plan verifies its work with `npm run type-check` — if this stays broken, those checks are silently worthless.

Modify `services/frontend/package.json`. Change:

```json
    "type-check": "tsc --noEmit"
```

to:

```json
    "type-check": "tsc --noEmit -p tsconfig.app.json"
```

In the same `"scripts"` block, after that fixed line, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 2b: Verify the fix actually catches errors**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
echo "const __typeCheckCanary: number = 'not a number';" >> src/App.tsx
npm run type-check; echo "exit code: $?"
git checkout -- src/App.tsx
```

Expected: a real `error TS2322` is reported and the exit code is non-zero, proving `type-check` now actually checks something. The `git checkout` at the end restores `App.tsx` — confirm with `git diff src/App.tsx` that it shows no changes before continuing.

- [ ] **Step 3: Create the Vitest config**

Create `services/frontend/vitest.config.ts`:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: false,
    },
  })
)
```

- [ ] **Step 4: Create the test setup file**

Create `services/frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Verify the runner works with a trivial smoke test**

Create a temporary file `services/frontend/src/test/smoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('vitest smoke test', () => {
  it('renders a div', () => {
    render(<div>hello</div>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
```

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
```

Expected: `1 passed`. Then delete the smoke test — it served only to prove the runner works, it's not a real test of this codebase:

```bash
rm services/frontend/src/test/smoke.test.tsx
```

- [ ] **Step 6: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/package.json services/frontend/package-lock.json services/frontend/vitest.config.ts services/frontend/src/test/setup.ts
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "chore(frontend): add Vitest + React Testing Library + TanStack Query, fix type-check silently no-op'ing"
```

---

### Task 9: `types.ts` + `api.ts` updates for the new auth contract

**Files:**
- Modify: `services/frontend/src/lib/types.ts`
- Modify: `services/frontend/src/lib/api.ts`
- Test: `services/frontend/src/lib/api.test.ts`

**Interfaces:**
- Consumes: nothing from earlier frontend tasks (Task 8 only added tooling).
- Produces: `LoginResponse` is now `{mfa_required: true, session_id: string}` (breaking change from the current `{token: string}` shape — matches the real backend from Task 3). New `MfaSendRequest`, `MfaSendResponse`, `MfaVerifyRequest`, `MfaVerifyResponse` types. `authApi.login()`, `authApi.mfaSend()`, `authApi.mfaVerify()` — all three consumed by Task 10/11's page components.

- [ ] **Step 1: Write the failing test**

Create `services/frontend/src/lib/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authApi } from './api'

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login() posts credentials and returns mfa_required + session_id', async () => {
    const mockResponse = { mfa_required: true, session_id: 'abc-123' }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const result = await authApi.login({
      email: 'alice.admin@globaltech.io',
      password: 'Password1!',
      tenant_slug: 'tenant_a',
    })

    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('mfaSend() posts session_id', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'sent' }),
    })

    const result = await authApi.mfaSend({ session_id: 'abc-123' })

    expect(result).toEqual({ status: 'sent' })
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(opts.body)).toEqual({ session_id: 'abc-123' })
  })

  it('mfaVerify() posts session_id + code and returns a token', async () => {
    const mockResponse = {
      token: 'jwt-token-here',
      expires_at: '2026-07-10T00:00:00Z',
      user: { id: 'u1', email: 'alice.admin@globaltech.io', full_name: 'Alice Admin', role: 'admin', is_active: true, created_at: '', updated_at: '' },
    }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const result = await authApi.mfaVerify({ session_id: 'abc-123', code: '123456' })

    expect(result).toEqual(mockResponse)
  })

  it('mfaVerify() throws ApiError on 401', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid code' }),
    })

    await expect(authApi.mfaVerify({ session_id: 'abc-123', code: '000000' })).rejects.toThrow('invalid code')
  })
})
```

- [ ] **Step 1b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
```

Expected: `FAIL` — `authApi.mfaSend` and `authApi.mfaVerify` are undefined, and the `login()` test fails because the current mocked response shape (`{mfa_required, session_id}`) doesn't match what the current implementation's types expect (`LoginResponse` is still `{token: string}` in `types.ts`).

- [ ] **Step 2: Update `types.ts`**

Modify `services/frontend/src/lib/types.ts`. Replace the `LoginResponse` interface (current lines 21-23):

```typescript
export interface LoginResponse {
  token: string;
}
```

with:

```typescript
export interface LoginResponse {
  mfa_required: true;
  session_id: string;
}

export interface MfaSendRequest {
  session_id: string;
}

export interface MfaSendResponse {
  status: string;
}

export interface MfaVerifyRequest {
  session_id: string;
  code: string;
}

export interface MfaVerifyResponse {
  token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "agent" | "viewer";
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}
```

(Leave `RefreshRequest`/`RefreshResponse` untouched — `/auth/refresh` isn't part of this sprint's scope.)

- [ ] **Step 3: Update `api.ts`'s `authApi`**

Modify `services/frontend/src/lib/api.ts`. Update the imports (current lines 12-30) to add the four new types:

```typescript
import type {
  LoginRequest,
  LoginResponse,
  MfaSendRequest,
  MfaSendResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  RefreshRequest,
  RefreshResponse,
  Incident,
  IncidentEvent,
  IncidentListParams,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  AssignIncidentRequest,
  ResolveIncidentRequest,
  CreateIncidentEventRequest,
  Asset,
  AssetListParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  PaginatedResponse,
} from "./types";
```

Replace the `authApi` object (current lines 131-155):

```typescript
export const authApi = {
  /**
   * Start a login — validates credentials, returns an MFA session to
   * complete via mfaSend() + mfaVerify(). Does NOT return a usable token.
   */
  login(body: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Trigger sending (or, in dev mode, server-side logging) of the email OTP
   * for a pending login session.
   */
  mfaSend(body: MfaSendRequest): Promise<MfaSendResponse> {
    return request<MfaSendResponse>("/api/v1/auth/mfa/send", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Complete login by submitting the OTP. Returns the real JWT — caller
   * stores it via setToken().
   */
  mfaVerify(body: MfaVerifyRequest): Promise<MfaVerifyResponse> {
    return request<MfaVerifyResponse>("/api/v1/auth/mfa/verify", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Exchange an expiring token for a fresh one.
   * Returns { token } — caller stores it via setToken().
   */
  refresh(body: RefreshRequest): Promise<RefreshResponse> {
    return request<RefreshResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body,
      public: true,
    });
  },
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
npm run type-check
```

Expected: all 4 tests in `api.test.ts` `PASS`; `type-check` succeeds (confirms no other file in the codebase was relying on the old `LoginResponse` shape — if `type-check` fails elsewhere, that call site needs updating too as part of this same step, not deferred).

- [ ] **Step 5: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/src/lib/types.ts services/frontend/src/lib/api.ts services/frontend/src/lib/api.test.ts
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(frontend): update auth API contract for MFA login flow"
```

---

### Task 10: Login page + Forgot-password stub

**Files:**
- Create: `services/frontend/src/pages/Login.tsx`
- Create: `services/frontend/src/pages/Login.module.css`
- Create: `services/frontend/src/pages/ForgotPassword.tsx`
- Test: `services/frontend/src/pages/Login.test.tsx`

**Interfaces:**
- Consumes: `authApi.login` (Task 9), `Button`, `Icon` from `@/components/ui` (existing, Sprint 0), existing `.row`/`.col`/`.input`/`.field-label`/`.muted`/`.display`/`.hr` utility classes from `src/index.css` (existing, Sprint 0).
- Produces: `export default function Login()` — a route component. On successful credential validation, calls `navigate("/login/mfa", { state: { sessionId, email } })` (Task 11 reads this state).

- [ ] **Step 1: Write the failing test**

Create `services/frontend/src/pages/Login.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './Login'
import * as api from '@/lib/api'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockNavigate = vi.fn()

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders email, password fields, and a sign-in button', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('does not render any SSO buttons', () => {
    renderLogin()
    expect(screen.queryByText(/okta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/azure/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument()
  })

  it('navigates to /login/mfa with sessionId on successful submit', async () => {
    vi.spyOn(api.authApi, 'login').mockResolvedValue({ mfa_required: true, session_id: 'sess-abc' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alice.admin@globaltech.io' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login/mfa', {
        state: { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' },
      })
    })
  })

  it('shows an error message on invalid credentials', async () => {
    vi.spyOn(api.authApi, 'login').mockRejectedValue(new api.ApiError(401, 'invalid credentials'))

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alice.admin@globaltech.io' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 1b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
```

Expected: `FAIL` — `./Login` module doesn't exist yet.

- [ ] **Step 2: Create the CSS module**

Create `services/frontend/src/pages/Login.module.css` (layout-only — colors/spacing/typography all come from the existing token-driven utility classes; this module only handles the split-screen structure the prototype uses inline styles for):

```css
.page {
  display: flex;
  min-height: 100vh;
}

.brandPanel {
  flex: 1 1 52%;
  background: oklch(0.18 0.04 var(--accent-h));
  color: #fff;
  padding: 40px 52px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
}

.brandPanelGlow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1000px 600px at 70% -10%, oklch(0.5 0.2 var(--accent-h) / 0.55), transparent 60%),
    radial-gradient(800px 500px at 0% 110%, oklch(0.5 0.2 calc(var(--accent-h) + 50) / 0.4), transparent 55%);
}

.brandPanelGrid {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background-image:
    linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 50% 40%, #000, transparent 75%);
}

.brandContent {
  position: relative;
  max-width: 460px;
  padding: 28px 0;
}

.statRow {
  display: flex;
  flex-wrap: wrap;
  margin-top: 28px;
  gap: 28px;
}

.formPanel {
  flex: 1 1 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: var(--bg);
}

.formInner {
  width: 100%;
  max-width: 384px;
}

.errorBanner {
  color: var(--critical, #c0392b);
  font-size: 13px;
  margin: 4px 0 0;
}
```

- [ ] **Step 3: Implement the Login page**

Create `services/frontend/src/pages/Login.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Icon, Button } from '@/components/ui'
import { authApi, ApiError } from '@/lib/api'
import styles from './Login.module.css'

const STATS: Array<[string, string]> = [
  ['96%', 'alert noise reduced'],
  ['41 min', 'median MTTR'],
  ['64%', 'auto-resolved'],
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantSlug, setTenantSlug] = useState('tenant_a')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      navigate('/login/mfa', { state: { sessionId: data.session_id, email } })
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    loginMutation.mutate({ email, password, tenant_slug: tenantSlug })
  }

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div className={styles.brandPanelGlow} />
        <div className={styles.brandPanelGrid} />
        <div className="row gap-2" style={{ alignItems: 'center', position: 'relative' }}>
          <Icon name="sparkles" size={22} fill />
          <span className="display" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.03em' }}>Synap</span>
        </div>

        <div className={styles.brandContent}>
          <div className="badge ai" style={{ marginBottom: 20, background: 'oklch(1 0 0 / 0.14)', color: '#fff' }}>
            <Icon name="sparkles" size={12} fill />The AI nervous system for IT
          </div>
          <h1 className="display" style={{ fontSize: 38, lineHeight: 1.08, margin: '0 0 14px', fontWeight: 600, letterSpacing: '-0.03em' }}>
            The nervous system of your enterprise.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: 'oklch(1 0 0 / 0.72)', margin: 0 }}>
            Traditional ITSM is a fractured mess of slow tickets. Synap instantly routes ITOM alerts to automated fixes — so issues resolve themselves, while your team stays in control.
          </p>
          <div className={styles.statRow}>
            {STATS.map(([n, l]) => (
              <div key={l} className="col" style={{ gap: 2 }}>
                <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'oklch(1 0 0 / 0.6)', whiteSpace: 'nowrap' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="row gap-2" style={{ position: 'relative', fontSize: 12.5, color: 'oklch(1 0 0 / 0.55)' }}>
          <Icon name="shield" size={14} /> SOC 2 Type II · ISO 27001 · GDPR-ready · Hosted on your Kubernetes
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formInner}>
          <h2 className="display" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Sign in to Synap</h2>
          <p className="muted" style={{ margin: '0 0 26px', fontSize: 14 }}>Welcome back. Let's get your operations running.</p>

          <form onSubmit={handleSubmit} className="col gap-3">
            <div>
              <label className="field-label" htmlFor="tenant-slug">Workspace</label>
              <input
                id="tenant-slug"
                className="input"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="tenant_a"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Work email</label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="spread" style={{ marginBottom: 6 }}>
                <label className="field-label" style={{ margin: 0 }} htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
              </div>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className={styles.errorBanner}>{error}</p>}
            <Button type="submit" variant="primary" size="lg" block disabled={loginMutation.isPending} style={{ marginTop: 4 }}>
              {loginMutation.isPending ? (
                <span className="typing"><span /><span /><span /></span>
              ) : (
                <>Sign in <Icon name="arrowR" size={16} /></>
              )}
            </Button>
          </form>

          <div className="row gap-2 center" style={{ marginTop: 34, fontSize: 12, color: 'var(--faint)' }}>
            <Icon name="lock" size={12} /> Secured with end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create the Forgot-password stub**

Create `services/frontend/src/pages/ForgotPassword.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Icon, Button } from '@/components/ui'

export default function ForgotPassword() {
  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24 }}>
      <div className="col" style={{ width: '100%', maxWidth: 384 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="lock" size={22} />
        </div>
        <h2 className="display" style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px' }}>Reset your password</h2>
        <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
          Password reset isn't available yet — contact your workspace admin for now.
        </p>
        <Link to="/login">
          <Button variant="ghost" size="sm" style={{ paddingLeft: 4 }}>
            <Icon name="chevL" size={15} /> Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run to verify tests pass**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
npm run type-check
```

Expected: all `Login.test.tsx` tests `PASS`; `type-check` clean.

- [ ] **Step 6: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/src/pages/Login.tsx services/frontend/src/pages/Login.module.css services/frontend/src/pages/Login.test.tsx services/frontend/src/pages/ForgotPassword.tsx
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(frontend): add Login page (email/password, no SSO) + Forgot-password stub"
```

---

### Task 11: MFA page (guarded route)

**Files:**
- Create: `services/frontend/src/pages/LoginMfa.tsx`
- Test: `services/frontend/src/pages/LoginMfa.test.tsx`

**Interfaces:**
- Consumes: `authApi.mfaSend`, `authApi.mfaVerify` (Task 9); `location.state.sessionId`/`location.state.email` set by Task 10's `Login` page navigation call.
- Produces: `export default function LoginMfa()`. On successful verify, calls `setToken(data.token)` (existing `lib/auth.ts`, unchanged) then `navigate("/welcome")` (Task 12 provides that route).

- [ ] **Step 1: Write the failing test**

Create `services/frontend/src/pages/LoginMfa.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginMfa from './LoginMfa'
import * as api from '@/lib/api'
import * as auth from '@/lib/auth'

const mockNavigate = vi.fn()
let mockLocationState: unknown = { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  }
})

function renderMfa() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginMfa />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginMfa page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLocationState = { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' }
  })

  it('redirects to /login if there is no sessionId in router state', () => {
    mockLocationState = null
    renderMfa()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('renders 6 digit inputs and a verify button when sessionId is present', () => {
    renderMfa()
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('submits the entered code and stores the token on success', async () => {
    vi.spyOn(api.authApi, 'mfaVerify').mockResolvedValue({
      token: 'jwt-token-here',
      expires_at: '2026-07-10T00:00:00Z',
      user: { id: 'u1', email: 'alice.admin@globaltech.io', full_name: 'Alice Admin', role: 'admin', is_active: true, created_at: '', updated_at: '' },
    })
    const setTokenSpy = vi.spyOn(auth, 'setToken')

    renderMfa()
    const boxes = screen.getAllByRole('textbox')
    ;['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(boxes[i], { target: { value: digit } })
    })
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))

    await waitFor(() => {
      expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-here')
      expect(mockNavigate).toHaveBeenCalledWith('/welcome')
    })
  })

  it('shows an error on wrong code and does not navigate', async () => {
    vi.spyOn(api.authApi, 'mfaVerify').mockRejectedValue(new api.ApiError(401, 'invalid code'))

    renderMfa()
    const boxes = screen.getAllByRole('textbox')
    ;['0', '0', '0', '0', '0', '0'].forEach((digit, i) => {
      fireEvent.change(boxes[i], { target: { value: digit } })
    })
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it('calls mfaSend automatically on mount, and again on Resend click', async () => {
    const mfaSendSpy = vi.spyOn(api.authApi, 'mfaSend').mockResolvedValue({ status: 'sent' })

    renderMfa()
    await waitFor(() => expect(mfaSendSpy).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByText(/resend/i))
    await waitFor(() => expect(mfaSendSpy).toHaveBeenCalledTimes(2))
  })
})
```

- [ ] **Step 1b: Run to verify it fails**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
```

Expected: `FAIL` — `./LoginMfa` doesn't exist yet.

- [ ] **Step 2: Implement the MFA page**

Create `services/frontend/src/pages/LoginMfa.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Icon, Button } from '@/components/ui'
import { authApi, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'

interface MfaLocationState {
  sessionId: string
  email: string
}

export default function LoginMfa() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as MfaLocationState | null

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const sendMutation = useMutation({ mutationFn: authApi.mfaSend })
  const verifyMutation = useMutation({
    mutationFn: authApi.mfaVerify,
    onSuccess: (data) => {
      setToken(data.token)
      navigate('/welcome')
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.')
    },
  })

  useEffect(() => {
    if (!state?.sessionId) {
      navigate('/login', { replace: true })
      return
    }
    sendMutation.mutate({ session_id: state.sessionId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state?.sessionId) {
    return null
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleVerify() {
    setError(null)
    verifyMutation.mutate({ session_id: state!.sessionId, code: digits.join('') })
  }

  function handleResend() {
    setError(null)
    sendMutation.mutate({ session_id: state!.sessionId })
  }

  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24 }}>
      <div className="col" style={{ width: '100%', maxWidth: 384 }}>
        <Button variant="ghost" size="sm" style={{ alignSelf: 'flex-start', marginBottom: 18, paddingLeft: 4 }} onClick={() => navigate('/login')}>
          <Icon name="chevL" size={15} /> Back
        </Button>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="shield" size={22} />
        </div>
        <h2 className="display" style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px' }}>Two-factor authentication</h2>
        <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
          Enter the code we emailed to <b style={{ color: 'var(--ink-2)' }}>{state.email}</b>.
        </p>
        <div className="row gap-2" style={{ justifyContent: 'space-between', marginBottom: 22 }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              className="input mono"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              style={{ width: 50, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, padding: 0 }}
            />
          ))}
        </div>
        {error && <p style={{ color: 'var(--critical, #c0392b)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <Button variant="primary" size="lg" block onClick={handleVerify} disabled={verifyMutation.isPending || digits.some((d) => !d)}>
          {verifyMutation.isPending ? <span className="typing"><span /><span /><span /></span> : 'Verify & continue'}
        </Button>
        <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
          Didn't get a code?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Resend
          </a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run to verify tests pass**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
npm run type-check
```

Expected: all `LoginMfa.test.tsx` tests `PASS`; `type-check` clean.

- [ ] **Step 4: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/src/pages/LoginMfa.tsx services/frontend/src/pages/LoginMfa.test.tsx
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(frontend): add MFA code-entry page, guarded on router state"
```

---

### Task 12: Welcome placeholder + full routing wire-up

**Files:**
- Create: `services/frontend/src/pages/Welcome.tsx`
- Modify: `services/frontend/src/App.tsx`
- Modify: `services/frontend/src/main.tsx` (wrap with `QueryClientProvider`)

**Interfaces:**
- Consumes: `isAuthenticated`, `getEmail`, `logout` from `@/lib/auth` (existing, unchanged).
- Produces: `/welcome` route exists and is reachable; `App.tsx` has `/login`, `/login/mfa`, `/forgot-password`, `/welcome` all registered; root path `/` now redirects to `/login` (previously redirected to `/dev/components`, which is no longer the sane default now that a real entry point exists).

- [ ] **Step 1: Create the Welcome placeholder page**

Create `services/frontend/src/pages/Welcome.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { Icon, Button } from '@/components/ui'
import { getEmail, logout } from '@/lib/auth'

export default function Welcome() {
  const navigate = useNavigate()
  const email = getEmail()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24, gap: 16 }}>
      <Icon name="checkCircle" size={40} />
      <h1 className="display" style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
        Welcome{email ? `, ${email}` : ''}
      </h1>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
        App Shell is coming in Sprint 2 — you're logged in and your session is real.
      </p>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <Icon name="logout" size={15} /> Log out
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Wire `QueryClientProvider` in `main.tsx`**

Replace the full contents of `services/frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 3: Add the new routes to `App.tsx`**

Replace the full contents of `services/frontend/src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DevComponents from '@/pages/DevComponents'
import Login from '@/pages/Login'
import LoginMfa from '@/pages/LoginMfa'
import ForgotPassword from '@/pages/ForgotPassword'
import Welcome from '@/pages/Welcome'

const THEME_KEY = 'synap-theme'

export default function App() {
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) ?? 'light') as 'light' | 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/mfa" element={<LoginMfa />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/dev/components" element={<DevComponents />} />
        {/* Sprint 2+ routes are added here as screens are built */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

(`/dev/components` stays reachable directly by URL — it's just no longer the catch-all default, since `/login` is now the real entry point.)

- [ ] **Step 4: Manual browser verification (per project convention for UI changes)**

Start the dev server and walk the full flow in a real browser:

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm run dev
```

Open `http://localhost:5173` — confirm it redirects to `/login`, no SSO buttons render, the split-screen brand panel matches the prototype's visual structure. This step cannot exercise the real backend yet (no dev-server proxy is configured — Task 14's deployed build is what gets tested against the real cluster in Task 14/15). Confirm the UI renders correctly and the client-side validation/error states work by temporarily pointing `fetch` at a mock or by using the browser devtools to inspect the request being made to `/api/v1/auth/login` (it will 404 locally, which is expected — this step is a visual/structural check, not a functional one; Task 14 is where the real functional check happens).

- [ ] **Step 5: Run full test suite + type-check**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app/services/frontend"
npm test
npm run type-check
npm run lint
```

Expected: all tests `PASS`, no type errors, no lint errors.

- [ ] **Step 6: Stage and hand off**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/src/pages/Welcome.tsx services/frontend/src/main.tsx services/frontend/src/App.tsx
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "feat(frontend): wire Login/MFA/Welcome routing, add QueryClientProvider"
```

---

### Task 13: Frontend version bump, image build, and deploy to itsm-dev

**Files:**
- Modify: `services/frontend/VERSION`
- Modify: `services/frontend/CHANGELOG.md`
- Modify: `infra/helm/itsm-app/values.yaml` (bump `frontend.image.tag`)

**Interfaces:** none — packaging/deploy task.

- [ ] **Step 1: Bump `VERSION`**

Modify `services/frontend/VERSION` — change its contents from `0.1.0` to:

```
0.2.0
```

- [ ] **Step 2: Update `CHANGELOG.md`**

Modify `services/frontend/CHANGELOG.md`. The current file has:

```markdown
## [Unreleased]

### Planned (v0.2.0 — Sprint 1)
- Login page: split-screen brand panel + email/password form
- 6-digit email OTP step
- Forgot password page (stub)
- React Router: `/login` → `/login/mfa` → `/forgot-password`
- JWT stored in `localStorage` on successful MFA verify
- Wired to real `user-service` endpoints

### Planned (v0.3.0 — Sprint 2)
```

Replace it with:

```markdown
## [Unreleased]

### Planned (v0.3.0 — Sprint 2)
```

and add, right after the `## [0.1.0] - 2026-06-18` section's closing content (before the file ends), a new entry — since `[0.1.0]` is currently the last entry in the file, append after it:

```markdown

---

## [0.2.0] - 2026-07-09

### Added (Sprint 1 — Authentication)
- `/login` — split-screen brand panel + email/password form (no SSO — see design spec)
- `/login/mfa` — 6-digit email OTP entry, guarded on React Router navigation state (redirects to `/login` if accessed directly)
- `/forgot-password` — stub page, same visual language, no backend call
- `/welcome` — temporary post-login landing page (App Shell arrives in Sprint 2)
- Wired to the real `user-service` endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/mfa/send`, `POST /api/v1/auth/mfa/verify`
- JWT stored in `localStorage` on successful MFA verify (existing `lib/auth.ts`, unchanged)
- TanStack Query added for all auth mutations
- Vitest + React Testing Library added — first automated frontend tests in this repo
```

- [ ] **Step 3: Bump the image tag in `values.yaml`**

Modify `infra/helm/itsm-app/values.yaml`. Change:

```yaml
    tag: "latest"                 # only tag actually pushed to Docker Hub as of Phase 6
```

(in the `frontend:` block) to:

```yaml
    tag: "v0.2.0"                 # Sprint 1: Login + email OTP MFA
```

Also change `pullPolicy` back from the earlier session's temporary workaround:

```yaml
    pullPolicy: Always             # TEMP: v0.1.0 is still being iterated on during initial deploy debugging —
                                    # IfNotPresent lets nodes serve a stale cached image under this same tag.
                                    # Revert to IfNotPresent once this image is stable.
```

to:

```yaml
    pullPolicy: IfNotPresent
```

(This is safe now — `v0.2.0` is a fresh tag no node has ever cached, so the original stale-cache problem from earlier this session doesn't apply.)

- [ ] **Step 4: Verify the Helm template renders correctly**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
helm template itsm-app ./infra/helm/itsm-app -f infra/helm/itsm-app/values.yaml -s templates/frontend/deployment.yaml
```

Expected: `image: "preet2fun/frontend:v0.2.0"`, `imagePullPolicy: IfNotPresent`.

- [ ] **Step 5: Stage locally, then hand off both the local commit and the cluster deploy commands**

```bash
cd "/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app"
git add services/frontend/VERSION services/frontend/CHANGELOG.md infra/helm/itsm-app/values.yaml
git status --short
```

Report the diff and this commit command back to the user (do not run it):
```bash
git commit -m "chore(frontend): bump to v0.2.0 for Sprint 1 login + MFA"
git push
```

Then give the user these commands to run on the K8s master, **after** they've pushed:

```bash
cd /home/motadata/itsm-cloudnative-demo-app
git pull
cd services/frontend
docker build -t preet2fun/frontend:v0.2.0 .
docker push preet2fun/frontend:v0.2.0
cd /home/motadata/itsm-cloudnative-demo-app

helm upgrade --install itsm-app ./infra/helm/itsm-app -f infra/helm/itsm-app/values.yaml -n itsm-dev
kubectl rollout restart deployment/frontend -n itsm-dev
kubectl rollout status deployment/frontend -n itsm-dev
kubectl get pods -n itsm-dev -o wide
```

Expected: `frontend` pod comes up `2/2 Running`. If it crash-loops, check for the same nginx `readOnlyRootFilesystem`/port-8080 issues already solved earlier this session — those fixes are already in the deployment template and should not recur, but verify `kubectl logs` if anything looks wrong rather than assuming.

---

### Task 14: Full E2E verification on the live dev cluster

**Files:** none — verification only, no code changes.

**Interfaces:** none.

This task runs the 6 acceptance tests from the design spec (§7) against the real, deployed `itsm-dev` cluster, in a real browser — not curl. This is the actual proof the sprint works end to end.

- [ ] **Step 1: Confirm both services are healthy**

Give the user this to run on the K8s master:

```bash
kubectl get pods -n itsm-dev -o wide
```

Expected: `user-service` and `frontend` both `2/2 Running`, no recent restarts.

- [ ] **Step 2: Test 1 — admin login full happy path**

In a real browser, navigate to `http://172.16.15.206:30080` (or the app's current NodePort/ingress address). Confirm it redirects to `/login`. Log in with `alice.admin@globaltech.io` / `Password1!` / `tenant_a`. Confirm it navigates to `/login/mfa`. Retrieve the OTP from the pod logs:

```bash
kubectl logs -n itsm-dev -l app=user-service -c user-service --tail=20 | grep "dev-mode: MFA OTP"
```

Enter that code in the browser. Confirm it navigates to `/welcome` and shows the logged-in email. Open browser devtools → Application → Local Storage → confirm `itsm_token` is set to a real JWT string.

- [ ] **Step 3: Test 2 — separate tenant, separate session**

In a private/incognito browser window, log in as `bob.agent@startupco.io` (tenant_b — confirm the exact seeded password with the user if not already known from this session's earlier context; if unknown, ask the user directly rather than guessing). Confirm this session's `itsm_token` (in the incognito window) differs from the tenant_a session's token, and that the JWT payload (decode at jwt.io or via browser devtools) shows `tenant_id` matching tenant_b, not tenant_a.

- [ ] **Step 4: Test 3 — wrong OTP**

Start a fresh login (`alice.admin@globaltech.io`), reach `/login/mfa`, and enter an incorrect 6-digit code. Confirm the page shows an error message and does not navigate away.

- [ ] **Step 5: Test 4 — expired OTP**

Start a fresh login, reach `/login/mfa`, wait 6+ minutes (or, faster: manually delete the Redis key via `kubectl exec` into a pod with redis-cli, or port-forward and use `redis-cli DEL itsm:tenant_a:otp:<session-id>` — get the exact `session_id` from the browser's network tab), then submit the (now-expired) code. Confirm an error message and no navigation.

- [ ] **Step 6: Test 5 — refresh mid-MFA redirects to /login**

Start a fresh login, reach `/login/mfa`, then hit the browser's refresh button. Confirm it redirects to `/login` (not stuck on a broken MFA screen).

- [ ] **Step 7: Test 6 — OTel sanity check**

Per spec §7 test 6, this requires a real or debug OTel Collector, which doesn't exist on the cluster (P-Phase 6 not started). Do this check locally against `user-service` running with a local debug collector, or defer it explicitly:

```bash
docker run --rm -p 4317:4317 -v "$(pwd)/otel-debug-config.yaml:/etc/otelcol/config.yaml" otel/opentelemetry-collector:latest --config /etc/otelcol/config.yaml
```

Where `otel-debug-config.yaml` is a minimal debug-exporter config:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
exporters:
  debug:
    verbosity: detailed
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      exporters: [debug]
```

Then run `user-service` locally with `OTEL_EXPORTER_OTLP_ENDPOINT=localhost:4317` and exercise the login/mfa/send/mfa/verify flow via curl, watching the collector's debug output for the three new spans (`itsm.user.login`, `itsm.user.mfa_send`, `itsm.user.mfa_verify`) and three new metrics (`itsm_login_attempts_total`, `itsm_mfa_otp_sent_total`, `itsm_mfa_verify_attempts_total`). If running Docker locally isn't practical in this environment, explicitly report this test as **deferred, not skipped** — flag it to the user as something to verify once P-Phase 6 (Observability) stands up the real Collector, rather than silently claiming it passed.

- [ ] **Step 8: Report results**

Summarize which of the 6 tests passed, which (if any) failed, and the status of test 6 specifically (verified locally / deferred to P-Phase 6). This is the final gate before Sprint 1 can be marked complete in `CLAUDE.md`'s Product Track table and issue #9 can be closed.

# Identity & Tenancy Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `user-service` support two populations of user in one shared `public.users` table — Customer App's tenant-scoped end-users and Platform App's cross-tenant platform staff — with login no longer requiring a tenant slug up front.

**Architecture:** A new, purely additive `public.users` table replaces per-tenant-schema `users` tables as the thing `user-service` reads/writes. `Repo`'s methods stop threading a `slug` through `search_path`; a caller's tenant scope becomes a plain `tenant_id` column value (`NULL` = platform staff). The MFA session flow (`Login` → `MfaSend` → `MfaVerify`) drops `tenant_slug` from its Redis-backed session state since it's no longer needed to find the user. Nothing in `tenant_a`/`tenant_b`/`tenant_c` (including `assets`/`incidents`) is touched — that's explicit, deferred scope (see spec §7).

**Tech Stack:** Go 1.22 (`user-service`), Chi v5, `pgx/v5`, `github.com/redis/go-redis/v9`, `golang-jwt/jwt/v5`, `golang-migrate` v4, Vite + React 18 + TypeScript (frontend), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-identity-tenancy-consolidation-design.md` — read it if a task's reasoning is unclear, especially §7 (the plan-time revision that narrowed this from "drop tenant_a/b/c" to purely additive).

## Global Constraints

- Repo root: `/Users/pratikpatel/Documents/study/Final Study/Cloud Architecture/ITSM-CloudNative-Demo-App/itsm-cloudnative-demo-app`
- `tenant_a`/`tenant_b`/`tenant_c` schemas, `public.tenants`, `create_tenant_schema`, and their `assets`/`incidents`/`incident_events` tables are **not touched by this plan at all** — no drops, no FK changes, no data migration. See spec §7.
- Go tests requiring live infra (`DATABASE_URL`, `REDIS_URL`) skip via `t.Skip(...)` when those env vars are unset — this codebase's established convention, confirmed in `internal/handlers/auth_test.go` and `internal/sessionstore/sessionstore_test.go`. Do not introduce a mocking framework.
- `DATABASE_URL`/`REDIS_URL` for local verification: source from `.env` (gitignored, already present in the repo root) — do not paste their literal values into commits or this plan.
- Existing live-tested credential to preserve: `alice.admin@globaltech.io` / `Password1!`, bcrypt hash `$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C` (from `platform-app/database/seeds/seed-tenant-a.sql`) — reused verbatim, not re-hashed.
- Per this project's standing convention: stage changes with `git add` but never run `git commit` or `git push` — hand that to the user at the end of each task.
- `golang-migrate` CLI is available locally (`/opt/homebrew/bin/migrate`) — migration tasks can be applied and verified directly against the live `DATABASE_URL`, no need to defer to a remote machine for this part.
- Actual K8s deployment (applying Istio YAML to the live cluster) happens on the K8s master (`kubernetes-master`, repo cloned at `/home/motadata/itsm-cloudnative-demo-app`), not this local Mac — Task 7 says so explicitly and gives copy-pasteable commands for the user to run there.
- Role values: `admin`, `agent`, `viewer` (existing, tenant-scoped meaning unchanged), `platform_admin`, `platform_analyst` (new, cross-tenant).
- Redis key convention (CLAUDE.md §8: never unprefixed): pending-login session stays `itsm:auth-session:{session_id}`; OTP key changes from `itsm:{tenant_slug}:otp:{session_id}` to `itsm:auth-otp:{session_id}` (tenant is no longer known/needed at that point in the flow — `session_id` is already a UUID, globally unique, so tenant-scoping was never load-bearing for uniqueness here).

---

### Task 1: Migration — `public.users` table

**Files:**
- Create: `platform-app/database/migrations/000006_create_shared_users.up.sql`
- Create: `platform-app/database/migrations/000006_create_shared_users.down.sql`

**Interfaces:**
- Produces: `public.users` table — columns `id UUID PK`, `email TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `full_name TEXT`, `role TEXT NOT NULL CHECK`, `tenant_id TEXT NULL`, `is_active BOOL`, `created_at`/`updated_at TIMESTAMPTZ`. Later tasks depend on this exact shape.

- [ ] **Step 1: Write the up migration**

```sql
-- platform-app/database/migrations/000006_create_shared_users.up.sql
-- Migration: 000006_create_shared_users
-- Description: Creates public.users — the single shared identity table for
--              both Customer App's tenant-scoped end-users (tenant_id set
--              to a customer-app tenant slug) and Platform App's own
--              cross-tenant staff (tenant_id NULL). Purely additive: does
--              NOT touch public.tenants, create_tenant_schema, or any
--              tenant_a/b/c schema — see design spec §7 for why.
-- Idempotent: yes (CREATE TABLE/INDEX IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        NOT NULL,
    password_hash   TEXT        NOT NULL,
    full_name       TEXT,
    role            TEXT        NOT NULL CHECK (role IN (
                        'admin', 'agent', 'viewer',
                        'platform_admin', 'platform_analyst'
                    )),
    tenant_id       TEXT,       -- NULL = platform staff, cross-tenant.
                                 -- set  = scoped to a customer-app tenant
                                 -- slug, validated at the app layer (no DB
                                 -- FK — see design spec §4.1/§6).
    is_active       BOOL        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_public_users_tenant_id ON public.users(tenant_id);
```

- [ ] **Step 2: Write the down migration**

```sql
-- platform-app/database/migrations/000006_create_shared_users.down.sql
DROP TABLE IF EXISTS public.users;
```

- [ ] **Step 3: Apply the migration against the live database and verify**

Run (from `platform-app/`, with `DATABASE_URL` sourced from `.env`):

```bash
set -a; source ../../.env; set +a
migrate -path database/migrations -database "${DATABASE_URL}" up
```

Expected: no errors; output shows migration to version 6.

Verify the table shape:

```bash
psql "${DATABASE_URL}" -c "\d public.users"
```

Expected: shows all 8 columns with the types above, a `UNIQUE` constraint on `email` (via the index), and the `role` CHECK constraint listing all 5 values.

- [ ] **Step 4: Verify the down migration cleanly reverses, then re-apply**

```bash
migrate -path database/migrations -database "${DATABASE_URL}" down 1
psql "${DATABASE_URL}" -c "\dt public.users" # expect: "Did not find any relation"
migrate -path database/migrations -database "${DATABASE_URL}" up
psql "${DATABASE_URL}" -c "\dt public.users" # expect: table listed again
```

- [ ] **Step 5: Commit**

```bash
git add platform-app/database/migrations/000006_create_shared_users.up.sql \
        platform-app/database/migrations/000006_create_shared_users.down.sql
```

(Stage only — do not run `git commit`, per Global Constraints.)

---

### Task 2: Seed the platform-staff test user

**Files:**
- Create: `platform-app/database/seeds/seed-platform-users.sql`

**Interfaces:**
- Consumes: `public.users` table from Task 1.
- Produces: one row in `public.users` — `alice.admin@globaltech.io`, `tenant_id = NULL`, `role = 'platform_admin'` — that Task 5/6's tests log in as.

- [ ] **Step 1: Write the seed file**

```sql
-- platform-app/database/seeds/seed-platform-users.sql
-- Seeds the one live-tested platform-staff credential into public.users.
-- Same person/password as platform-app/database/seeds/seed-tenant-a.sql's
-- alice.admin row (that row is left alone — see design spec §4.5) — this
-- is the new, additional home for her platform-staff identity.
-- Idempotent: ON CONFLICT DO NOTHING (matches this repo's other seed files).

INSERT INTO public.users (id, email, password_hash, full_name, role, tenant_id) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'alice.admin@globaltech.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Alice Admin',
   'platform_admin', NULL)
ON CONFLICT (email) DO NOTHING;
```

- [ ] **Step 2: Apply and verify**

```bash
set -a; source ../../.env; set +a
psql "${DATABASE_URL}" -f platform-app/database/seeds/seed-platform-users.sql
psql "${DATABASE_URL}" -c "SELECT email, role, tenant_id FROM public.users;"
```

Expected: one row, `alice.admin@globaltech.io | platform_admin | ` (empty/NULL tenant_id column).

- [ ] **Step 3: Commit**

```bash
git add platform-app/database/seeds/seed-platform-users.sql
```

---

### Task 3: `sessionstore` — drop `tenantSlug` threading

**Files:**
- Modify: `platform-app/services/user-service/internal/sessionstore/sessionstore.go`
- Modify: `platform-app/services/user-service/internal/sessionstore/sessionstore_test.go`

**Interfaces:**
- Produces: `(*Store).SaveSession(ctx, sessionID, userID string, ttl time.Duration) error`; `(*Store).GetSession(ctx, sessionID string) (userID string, err error)`; `(*Store).SaveOTP(ctx, sessionID, code string, ttl time.Duration) error`; `(*Store).GetOTP(ctx, sessionID string) (string, error)`; `(*Store).DeleteOTP(ctx, sessionID string) error`. `SaveSession`/`GetSession`/`DeleteSession` signatures otherwise unchanged. Task 5 (`auth.go`) consumes these new signatures.

- [ ] **Step 1: Update the failing tests first**

Replace the full content of `sessionstore_test.go`:

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

	if err := s.SaveSession(ctx, sessionID, "user-123", time.Minute); err != nil {
		t.Fatalf("SaveSession() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteSession(ctx, sessionID) })

	userID, err := s.GetSession(ctx, sessionID)
	if err != nil {
		t.Fatalf("GetSession() error = %v", err)
	}
	if userID != "user-123" {
		t.Errorf("GetSession() = %q, want %q", userID, "user-123")
	}
}

func TestGetSessionNotFound(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()

	_, err := s.GetSession(ctx, "nonexistent-session-id")
	if err != ErrNotFound {
		t.Errorf("GetSession() error = %v, want ErrNotFound", err)
	}
}

func TestSaveAndGetOTP(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-otp-session-" + t.Name()

	if err := s.SaveOTP(ctx, sessionID, "123456", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteOTP(ctx, sessionID) })

	code, err := s.GetOTP(ctx, sessionID)
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

	if err := s.SaveOTP(ctx, sessionID, "654321", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	if err := s.DeleteOTP(ctx, sessionID); err != nil {
		t.Fatalf("DeleteOTP() error = %v", err)
	}

	_, err := s.GetOTP(ctx, sessionID)
	if err != ErrNotFound {
		t.Errorf("GetOTP() after delete error = %v, want ErrNotFound", err)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail (compile error against old signatures)**

Run: `cd platform-app/services/user-service && go test ./internal/sessionstore/... -v`
Expected: FAIL to compile — `too many arguments in call to s.SaveSession` (and similar) against the still-old `sessionstore.go`.

- [ ] **Step 3: Update `sessionstore.go` to match**

Replace the full content:

```go
// Package sessionstore stores short-lived, pre-JWT authentication state
// (the pending-login session, and the email OTP for that session) in Redis.
package sessionstore

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ErrNotFound is returned when a session or OTP key doesn't exist or has expired.
var ErrNotFound = errors.New("sessionstore: not found")

type Store struct {
	client *redis.Client
}

// New creates a Store from a "redis://[user:pass@]host:port[/db]" (or "rediss://...") URL.
func New(redisURL string) (*Store, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("sessionstore: invalid redis URL: %w", err)
	}
	client := redis.NewClient(opts)
	return &Store{client: client}, nil
}

func (s *Store) Close() error {
	return s.client.Close()
}

type pendingSession struct {
	UserID string `json:"user_id"`
}

func sessionKey(sessionID string) string {
	return "itsm:auth-session:" + sessionID
}

func otpKey(sessionID string) string {
	return "itsm:auth-otp:" + sessionID
}

// SaveSession persists the pending-login user association, keyed by sessionID.
func (s *Store) SaveSession(ctx context.Context, sessionID, userID string, ttl time.Duration) error {
	rec := pendingSession{UserID: userID}
	data, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, sessionKey(sessionID), data, ttl).Err()
}

// GetSession returns the userID associated with sessionID.
// Returns ErrNotFound if the session doesn't exist or has expired.
func (s *Store) GetSession(ctx context.Context, sessionID string) (userID string, err error) {
	data, err := s.client.Get(ctx, sessionKey(sessionID)).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	var rec pendingSession
	if err := json.Unmarshal([]byte(data), &rec); err != nil {
		return "", err
	}
	return rec.UserID, nil
}

// DeleteSession removes the pending-login record.
func (s *Store) DeleteSession(ctx context.Context, sessionID string) error {
	return s.client.Del(ctx, sessionKey(sessionID)).Err()
}

// SaveOTP stores a one-time code for sessionID.
func (s *Store) SaveOTP(ctx context.Context, sessionID, code string, ttl time.Duration) error {
	return s.client.Set(ctx, otpKey(sessionID), code, ttl).Err()
}

// GetOTP returns the stored code. Returns ErrNotFound if missing/expired.
func (s *Store) GetOTP(ctx context.Context, sessionID string) (string, error) {
	code, err := s.client.Get(ctx, otpKey(sessionID)).Result()
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
func (s *Store) DeleteOTP(ctx context.Context, sessionID string) error {
	return s.client.Del(ctx, otpKey(sessionID)).Err()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/sessionstore/... -v`
Expected: `PASS` for all 4 tests (or `SKIP` if `REDIS_URL` isn't set in the shell — set it via `set -a; source ../../.env; set +a` from `platform-app/` first, per Global Constraints).

- [ ] **Step 5: Commit**

```bash
git add platform-app/services/user-service/internal/sessionstore/sessionstore.go \
        platform-app/services/user-service/internal/sessionstore/sessionstore_test.go
```

---

### Task 4: `models.go` + `user_repo.go` — shared-table repository

**Files:**
- Modify: `platform-app/services/user-service/internal/models/user.go`
- Modify: `platform-app/services/user-service/internal/repository/user_repo.go`
- Create: `platform-app/services/user-service/internal/repository/user_repo_test.go`

**Interfaces:**
- Consumes: `public.users` table (Task 1).
- Produces: `models.User{ID, Email, PasswordHash, FullName, Role, TenantID *string, IsActive, CreatedAt, UpdatedAt}`; `models.LoginRequest{Email, Password string}` (no `TenantSlug`); `repository.Repo` methods: `FindByEmail(ctx, email string) (*models.User, error)`, `FindByID(ctx, id uuid.UUID) (*models.User, error)`, `List(ctx, tenantID string, limit, offset int) ([]*models.User, int64, error)` (`tenantID == ""` means platform staff — filters `tenant_id IS NULL`; non-empty filters `tenant_id = $1`), `Create(ctx, u *models.User) (*models.User, error)` (`u.TenantID` drives the inserted row's scope), `Update(ctx, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error)`, `Delete(ctx, id uuid.UUID) error`, `UpdatePassword(ctx, id uuid.UUID, newHash string) error`. Tasks 5 and 6 consume these exact signatures.

- [ ] **Step 1: Write the failing repository test**

Create `user_repo_test.go`:

```go
package repository

import (
	"context"
	"os"
	"testing"

	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/models"
)

func testRepo(t *testing.T) *Repo {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set — skipping repository integration test")
	}
	pool, err := appdb.NewPool(context.Background(), dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)
	return New(pool)
}

func strPtr(s string) *string { return &s }

func TestCreateAndFindByEmail_TenantScoped(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	email := "repo-test-tenant-" + t.Name() + "@example.com"
	u := &models.User{
		Email:        email,
		PasswordHash: "irrelevant-hash",
		FullName:     "Repo Test Tenant User",
		Role:         "agent",
		TenantID:     strPtr("customer_a"),
	}
	created, err := r.Create(ctx, u)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, created.ID) })

	if created.TenantID == nil || *created.TenantID != "customer_a" {
		t.Errorf("created.TenantID = %v, want customer_a", created.TenantID)
	}

	found, err := r.FindByEmail(ctx, email)
	if err != nil {
		t.Fatalf("FindByEmail() error = %v", err)
	}
	if found.ID != created.ID {
		t.Errorf("FindByEmail() ID = %v, want %v", found.ID, created.ID)
	}
}

func TestCreateAndFindByEmail_PlatformStaff(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	email := "repo-test-platform-" + t.Name() + "@example.com"
	u := &models.User{
		Email:        email,
		PasswordHash: "irrelevant-hash",
		FullName:     "Repo Test Platform User",
		Role:         "platform_analyst",
		TenantID:     nil,
	}
	created, err := r.Create(ctx, u)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, created.ID) })

	if created.TenantID != nil {
		t.Errorf("created.TenantID = %v, want nil", created.TenantID)
	}
}

func TestList_FiltersByTenant(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	tenantUser, err := r.Create(ctx, &models.User{
		Email: "repo-test-list-tenant-" + t.Name() + "@example.com",
		PasswordHash: "x", FullName: "List Tenant", Role: "viewer",
		TenantID: strPtr("customer_b"),
	})
	if err != nil {
		t.Fatalf("Create() tenant user error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, tenantUser.ID) })

	platformUser, err := r.Create(ctx, &models.User{
		Email: "repo-test-list-platform-" + t.Name() + "@example.com",
		PasswordHash: "x", FullName: "List Platform", Role: "platform_admin",
		TenantID: nil,
	})
	if err != nil {
		t.Fatalf("Create() platform user error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, platformUser.ID) })

	tenantUsers, _, err := r.List(ctx, "customer_b", 100, 0)
	if err != nil {
		t.Fatalf("List(customer_b) error = %v", err)
	}
	foundTenant := false
	for _, u := range tenantUsers {
		if u.ID == tenantUser.ID {
			foundTenant = true
		}
		if u.ID == platformUser.ID {
			t.Errorf("List(customer_b) unexpectedly returned the platform-staff user")
		}
	}
	if !foundTenant {
		t.Errorf("List(customer_b) did not return the customer_b user")
	}

	platformUsers, _, err := r.List(ctx, "", 100, 0)
	if err != nil {
		t.Fatalf("List(\"\") error = %v", err)
	}
	foundPlatform := false
	for _, u := range platformUsers {
		if u.ID == platformUser.ID {
			foundPlatform = true
		}
		if u.ID == tenantUser.ID {
			t.Errorf("List(\"\") unexpectedly returned the customer_b user")
		}
	}
	if !foundPlatform {
		t.Errorf("List(\"\") did not return the platform-staff user")
	}
}

func TestFindByEmail_NotFound(t *testing.T) {
	r := testRepo(t)
	_, err := r.FindByEmail(context.Background(), "definitely-not-a-real-user@example.com")
	if err != ErrNotFound {
		t.Errorf("FindByEmail() error = %v, want ErrNotFound", err)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd platform-app/services/user-service && go test ./internal/repository/... -v`
Expected: FAIL to compile (`u.TenantID` field doesn't exist yet, `r.Create` signature mismatch, etc.)

- [ ] **Step 3: Update `models/user.go`**

Change the `User` struct and `LoginRequest`:

```go
// User maps directly to the public.users table.
type User struct {
	ID           uuid.UUID `db:"id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	FullName     string    `db:"full_name"`
	Role         string    `db:"role"` // admin | agent | viewer | platform_admin | platform_analyst
	TenantID     *string   `db:"tenant_id"` // nil = platform staff, cross-tenant
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
```

(Only that struct's field list changes — add `TenantID *string` after `Role`, update the doc comment. Everything else in the file, including `UserResponse`/`ToResponse`, is unchanged for this step.)

Change `LoginRequest`:

```go
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
```

(Drops the `TenantSlug` field entirely.)

- [ ] **Step 4: Update `repository/user_repo.go`**

Replace the full content:

```go
package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itsm-cloudnative/user-service/internal/models"
)

// ErrNotFound is returned when a queried user does not exist.
var ErrNotFound = errors.New("user not found")

// ErrEmailTaken is returned when creating a user with an already-registered email.
var ErrEmailTaken = errors.New("email already registered")

// Repo provides all database operations for public.users — the single
// shared identity table for both tenant-scoped Customer App end-users and
// cross-tenant Platform App staff.
type Repo struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

const userColumns = `id, email, password_hash, full_name, role, tenant_id, is_active, created_at, updated_at`

func scanUser(row pgx.Row) (*models.User, error) {
	var u models.User
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.TenantID, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByEmail returns the user matching the email, across all tenants.
func (r *Repo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM public.users WHERE email = $1`, email)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// FindByID returns the user matching the UUID.
func (r *Repo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM public.users WHERE id = $1`, id)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// List returns a paginated set of users. tenantID == "" means platform
// staff (tenant_id IS NULL); any other value filters to that tenant.
func (r *Repo) List(ctx context.Context, tenantID string, limit, offset int) ([]*models.User, int64, error) {
	var total int64
	var countRow pgx.Row
	var rows pgx.Rows
	var err error

	if tenantID == "" {
		countRow = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE tenant_id IS NULL`)
	} else {
		countRow = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE tenant_id = $1`, tenantID)
	}
	if err := countRow.Scan(&total); err != nil {
		return nil, 0, err
	}

	if tenantID == "" {
		rows, err = r.pool.Query(ctx,
			`SELECT `+userColumns+` FROM public.users WHERE tenant_id IS NULL
			 ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	} else {
		rows, err = r.pool.Query(ctx,
			`SELECT `+userColumns+` FROM public.users WHERE tenant_id = $1
			 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, tenantID, limit, offset)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

// Create inserts a new user and returns the persisted record.
// u.TenantID drives the inserted row's tenant scope.
func (r *Repo) Create(ctx context.Context, u *models.User) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO public.users (email, password_hash, full_name, role, tenant_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+userColumns,
		u.Email, u.PasswordHash, u.FullName, u.Role, u.TenantID,
	)
	created, err := scanUser(row)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	return created, nil
}

// Update modifies mutable fields on a user. Only non-nil pointer fields are changed.
func (r *Repo) Update(ctx context.Context, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`UPDATE public.users
		    SET full_name  = COALESCE($2, full_name),
		        role       = COALESCE($3, role),
		        is_active  = COALESCE($4, is_active),
		        updated_at = NOW()
		  WHERE id = $1
		  RETURNING `+userColumns,
		id, req.FullName, req.Role, req.IsActive,
	)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// Delete removes a user by ID. Returns ErrNotFound if the user does not exist.
func (r *Repo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM public.users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdatePassword sets a new password hash for the given user.
func (r *Repo) UpdatePassword(ctx context.Context, id uuid.UUID, newHash string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
		id, newHash,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

// isUniqueViolation returns true when err is a PostgreSQL unique constraint error (23505).
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return errors.Is(err, &pgUniqueViolation{}) ||
		fmt.Sprintf("%T", err) == "*pgconn.PgError" && containsCode(err, "23505")
}

func containsCode(err error, code string) bool {
	type pgErr interface{ SQLState() string }
	var pe pgErr
	if errors.As(err, &pe) {
		return pe.SQLState() == code
	}
	return false
}

// pgUniqueViolation is a sentinel so we can use errors.Is for type matching.
type pgUniqueViolation struct{}

func (*pgUniqueViolation) Error() string { return "unique violation" }
func (*pgUniqueViolation) Is(target error) bool {
	return containsCode(target, "23505")
}
```

Note: `appdb.SetTenantPath`/`withConn` are no longer used by this file — `internal/db/db.go`'s `SetTenantPath` function itself is left in place (untouched, unused by `user-service` after this task, but it's a small shared-package function, not worth deleting in this pass).

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/repository/... -v` (with `DATABASE_URL` sourced from `.env`)
Expected: all 4 tests `PASS`.

- [ ] **Step 6: Build the whole service to confirm nothing else is broken yet**

Run: `go build ./...`
Expected: FAILS — `internal/handlers/auth.go` and `internal/handlers/users.go` still call the old `Repo`/`LoginRequest` signatures. This is expected at this point; Tasks 5 and 6 fix them. Confirm the failures are exactly in those two files (not somewhere unexpected) before moving on.

- [ ] **Step 7: Commit**

```bash
git add platform-app/services/user-service/internal/models/user.go \
        platform-app/services/user-service/internal/repository/user_repo.go \
        platform-app/services/user-service/internal/repository/user_repo_test.go
```

---

### Task 5: `middleware/headers.go` — allow absent `X-Tenant-ID`

**Files:**
- Modify: `platform-app/services/user-service/internal/middleware/headers.go`

**Interfaces:**
- Produces: `middleware.TenantRequired` — now rejects only a *malformed* `X-Tenant-ID` (400), not an *absent* one. `middleware.GetTenantID(ctx)` returns `""` when absent. `middleware.GetUserRole` unchanged.

There's no dedicated test file for this middleware today (it's exercised indirectly through `users.go`'s handlers in Task 6) — this task makes the code change; Task 6's tests are what verify the platform-staff-gets-through behavior end to end.

- [ ] **Step 1: Update `headers.go`**

```go
package middleware

import (
	"context"
	"net/http"
	"regexp"
)

type contextKey int

const (
	tenantIDKey contextKey = iota
	userRoleKey
)

var slugRe = regexp.MustCompile(`^[a-z][a-z0-9_]{0,62}$`)

// TenantRequired extracts X-Tenant-ID and X-User-Role from the request headers
// (injected by Istio after JWT validation) and stores them in the context.
//
// X-Tenant-ID is optional, not required, despite the name (kept for
// backwards compatibility with existing call sites) — a platform-staff
// caller's JWT has no tenant_id claim, so Istio legitimately sends no
// X-Tenant-ID header at all for them (confirmed: Istio's outputClaimToHeaders
// simply omits the header when the source claim doesn't exist). Only a
// header that IS present but malformed is rejected.
func TenantRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slug := r.Header.Get("X-Tenant-ID")
		if slug != "" && !slugRe.MatchString(slug) {
			http.Error(w, `{"error":"X-Tenant-ID header contains invalid characters"}`, http.StatusBadRequest)
			return
		}

		role := r.Header.Get("X-User-Role")

		ctx := context.WithValue(r.Context(), tenantIDKey, slug)
		ctx = context.WithValue(ctx, userRoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetTenantID retrieves the tenant slug stored by TenantRequired.
// Returns "" for a platform-staff caller (no tenant_id claim on their JWT).
func GetTenantID(ctx context.Context) string {
	v, _ := ctx.Value(tenantIDKey).(string)
	return v
}

// GetUserRole retrieves the user role stored by TenantRequired.
func GetUserRole(ctx context.Context) string {
	v, _ := ctx.Value(userRoleKey).(string)
	return v
}
```

- [ ] **Step 2: Build to confirm this file compiles standalone**

Run: `go build ./internal/middleware/...`
Expected: succeeds (this package has no dependency on the still-broken handlers).

- [ ] **Step 3: Commit**

```bash
git add platform-app/services/user-service/internal/middleware/headers.go
```

---

### Task 6: `handlers/auth.go` — email-only login, shared-table JWT issuance

**Files:**
- Modify: `platform-app/services/user-service/internal/handlers/auth.go`
- Modify: `platform-app/services/user-service/internal/handlers/auth_test.go`

**Interfaces:**
- Consumes: `repository.Repo` (Task 4), `sessionstore.Store` (Task 3), `models.LoginRequest{Email, Password}` (Task 4).
- Produces: `AuthHandler.Login/MfaSend/MfaVerify/Refresh` unchanged in HTTP shape except `Login`'s request body drops `tenant_slug`. `ITSMClaims.TenantID` gets `omitempty` so platform-staff tokens omit the claim.

- [ ] **Step 1: Update the tests first**

In `auth_test.go`, remove `TenantSlug: "tenant_a"` from all three `models.LoginRequest{...}` literals (in `TestLoginReturnsMfaRequired`, `TestLoginInvalidCredentials`, `TestMfaSendSucceedsAfterLogin`, `TestMfaVerifyFullFlowSucceeds`, `TestMfaVerifyWrongCode`) and change the two `h.store.GetOTP(context.Background(), "tenant_a", loginResp.SessionID)` / `h.store.GetOTP(ctx, "tenant_a", loginResp.SessionID)` calls to `h.store.GetOTP(context.Background(), loginResp.SessionID)` / `h.store.GetOTP(ctx, loginResp.SessionID)` (matching Task 3's new signature). Every other line in the file (assertions, `TestMfaSendUnknownSession`, `TestGenerateOTPFormat`, `TestMfaVerifyUnknownSession`) is unchanged.

Also add one new test, appended to the file, covering the platform-staff path:

```go
func TestMfaVerifyFullFlow_PlatformStaffTokenOmitsTenantClaim(t *testing.T) {
	h := testHandler(t)
	ctx := context.Background()

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:    "alice.admin@globaltech.io",
		Password: "Password1!",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	if loginW.Code != http.StatusOK {
		t.Fatalf("Login() status = %d, body = %s", loginW.Code, loginW.Body.String())
	}
	var loginResp models.MfaRequiredResponse
	json.NewDecoder(loginW.Body).Decode(&loginResp)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	h.MfaSend(httptest.NewRecorder(), sendReq)

	code, err := h.store.GetOTP(ctx, loginResp.SessionID)
	if err != nil {
		t.Fatalf("GetOTP() error = %v", err)
	}

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: loginResp.SessionID, Code: code})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()
	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusOK {
		t.Fatalf("MfaVerify() status = %d, body = %s", verifyW.Code, verifyW.Body.String())
	}
	var verifyResp models.LoginResponse
	json.NewDecoder(verifyW.Body).Decode(&verifyResp)

	// Decode the JWT payload (no signature check needed — this test only
	// cares whether the tenant_id claim key is present in the JSON at all).
	parts := bytesSplitJWT(verifyResp.Token)
	var claims map[string]any
	if err := json.Unmarshal(parts, &claims); err != nil {
		t.Fatalf("decode claims: %v", err)
	}
	if _, present := claims["tenant_id"]; present {
		t.Errorf("platform-staff token has a tenant_id claim = %v, want omitted entirely", claims["tenant_id"])
	}
	if claims["role"] != "platform_admin" {
		t.Errorf("claims[role] = %v, want platform_admin", claims["role"])
	}
}

// bytesSplitJWT base64url-decodes a JWT's payload segment (index 1) without
// verifying its signature — test-only helper, mirrors what jwt-debugger
// tools do.
func bytesSplitJWT(token string) []byte {
	parts := strings.Split(token, ".")
	payload := parts[1]
	if m := len(payload) % 4; m != 0 {
		payload += strings.Repeat("=", 4-m)
	}
	decoded, _ := base64.URLEncoding.DecodeString(payload)
	return decoded
}
```

This needs two new imports in `auth_test.go`: `"encoding/base64"` and `"strings"`.

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/handlers/... -run TestLogin -v` (and the other renamed tests)
Expected: FAIL to compile — `models.LoginRequest` has no field `TenantSlug`, `h.store.GetOTP` arg count mismatch — until Step 3 lands.

- [ ] **Step 3: Update `auth.go`**

Apply these changes to the existing file (not a full rewrite — only the parts below change; everything else, including `MfaSendRequest`/`MfaVerifyRequest` handling, `generateOTP`, `extractBearerToken`, `mustParseUUID`, stays as-is):

`ITSMClaims` gains `omitempty` on `TenantID`:

```go
type ITSMClaims struct {
	TenantID string `json:"tenant_id,omitempty"`
	Role     string `json:"role"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}
```

`Login` — drop the tenant-slug requirement, call the new `Repo`/`Store` signatures:

```go
// Login validates credentials and starts the MFA step — it does NOT issue a
// JWT. On success, call POST /api/v1/auth/mfa/send with the returned
// session_id, then POST /api/v1/auth/mfa/verify with the emailed code.
//
// POST /api/v1/auth/login
// Body: { "email": "...", "password": "..." }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.login")
	defer span.End()

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	span.SetAttributes(attribute.String("user.email", req.Email))

	user, err := h.repo.FindByEmail(ctx, req.Email)
	if errors.Is(err, repository.ErrNotFound) {
		span.SetStatus(codes.Error, "user not found")
		h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
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
			attribute.String("result", "inactive_account"),
		))
		writeError(w, http.StatusUnauthorized, "account is inactive")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		span.SetStatus(codes.Error, "wrong password")
		h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
			attribute.String("result", "invalid_credentials"),
		))
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	sessionID := uuid.New().String()
	if err := h.store.SaveSession(ctx, sessionID, user.ID.String(), 10*time.Minute); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "session store failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if user.TenantID != nil {
		span.SetAttributes(attribute.String("tenant.id", *user.TenantID))
	}
	span.SetAttributes(attribute.String("user.role", user.Role))
	span.AddEvent("credentials_valid")
	h.loginAttempts.Add(ctx, 1, metric.WithAttributes(
		attribute.String("result", "success"),
	))

	writeJSON(w, http.StatusOK, &models.MfaRequiredResponse{
		MfaRequired: true,
		SessionID:   sessionID,
	})
}
```

`MfaSend` — drop `tenantSlug` from the session/OTP calls, use `FindByID(ctx, id)`:

```go
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

	userID, err := h.store.GetSession(ctx, req.SessionID)
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

	user, err := h.repo.FindByID(ctx, mustParseUUID(userID))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "user lookup failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.role", user.Role))

	code, err := generateOTP()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "otp generation failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := h.store.SaveOTP(ctx, req.SessionID, code, 5*time.Minute); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "otp store failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if h.cfg.SMTPHost == "" {
		// Dev mode — no real email provider. This log line IS the delivery
		// mechanism for local/dev-cluster testing (see design spec §4).
		slog.Info("dev-mode: MFA OTP generated", "email", user.Email, "code", code)
	}
	// else: real SMTP send — explicitly out of scope for Sprint 1 (design spec §8 non-goals).

	h.mfaOtpSent.Add(ctx, 1)

	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}
```

`MfaVerify` — same `tenantSlug` removal, `issueToken` now takes the user directly (no separate tenant param):

```go
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

	userID, err := h.store.GetSession(ctx, req.SessionID)
	if errors.Is(err, sessionstore.ErrNotFound) {
		span.SetStatus(codes.Error, "session not found")
		h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
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

	storedCode, err := h.store.GetOTP(ctx, req.SessionID)
	if errors.Is(err, sessionstore.ErrNotFound) {
		span.SetStatus(codes.Error, "otp expired")
		h.mfaVerifyAttempts.Add(ctx, 1, metric.WithAttributes(
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
			attribute.String("result", "invalid_code"),
		))
		writeError(w, http.StatusUnauthorized, "invalid code")
		return
	}

	// Single-use — delete immediately after a correct match, before doing
	// anything else that could fail and leave a valid code reusable.
	if err := h.store.DeleteOTP(ctx, req.SessionID); err != nil {
		span.RecordError(err) // non-fatal — log via span, continue
	}

	user, err := h.repo.FindByID(ctx, mustParseUUID(userID))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "user lookup failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	token, expiresAt, err := h.issueToken(user)
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
		attribute.String("result", "success"),
	))

	writeJSON(w, http.StatusOK, &models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user.ToResponse(),
	})
}
```

`Refresh` — build a `*models.User` from the parsed claims (including `TenantID`) before re-issuing:

```go
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.refresh")
	defer span.End()

	_ = ctx

	raw := extractBearerToken(r)
	if raw == "" {
		writeError(w, http.StatusUnauthorized, "Authorization header missing or malformed")
		return
	}

	claims := &ITSMClaims{}
	_, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return &h.cfg.JWTPrivateKey.PublicKey, nil
	})
	if err != nil {
		span.SetStatus(codes.Error, "invalid token")
		writeError(w, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	var tenantID *string
	if claims.TenantID != "" {
		tenantID = &claims.TenantID
	}
	user := &models.User{
		ID:       mustParseUUID(claims.Subject),
		Email:    claims.Email,
		Role:     claims.Role,
		TenantID: tenantID,
	}
	token, expiresAt, err := h.issueToken(user)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "token issue failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if claims.TenantID != "" {
		span.SetAttributes(attribute.String("tenant.id", claims.TenantID))
	}
	span.SetAttributes(attribute.String("user.role", claims.Role))
	span.AddEvent("refresh_success")

	writeJSON(w, http.StatusOK, &models.RefreshResponse{
		Token:     token,
		ExpiresAt: expiresAt,
	})
}
```

`issueToken` — reads `TenantID` off the user, not a separate parameter:

```go
func (h *AuthHandler) issueToken(user *models.User) (string, time.Time, error) {
	expiresAt := time.Now().Add(time.Duration(h.cfg.JWTExpiryHours) * time.Hour)

	tenantID := ""
	if user.TenantID != nil {
		tenantID = *user.TenantID
	}

	claims := ITSMClaims{
		TenantID: tenantID,
		Role:     user.Role,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = "itsm-rs256-v1"

	signed, err := token.SignedString(h.cfg.JWTPrivateKey)
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, expiresAt, nil
}
```

Everything else in `auth.go` (`NewAuthHandler`, `extractBearerToken`, `mustParseUUID`, `generateOTP`) is unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/handlers/... -v` (with `DATABASE_URL`/`REDIS_URL` sourced, and Task 2's seed applied so `alice.admin@globaltech.io` exists in `public.users`)
Expected: all tests `PASS`, including the new `TestMfaVerifyFullFlow_PlatformStaffTokenOmitsTenantClaim`.

- [ ] **Step 5: Build the whole service again**

Run: `go build ./...`
Expected: still fails, now only in `internal/handlers/users.go` (Task 7 fixes it). Confirm that's the only remaining failure.

- [ ] **Step 6: Commit**

```bash
git add platform-app/services/user-service/internal/handlers/auth.go \
        platform-app/services/user-service/internal/handlers/auth_test.go
```

---

### Task 7: `handlers/users.go` — shared-table CRUD, IDOR guard, `InternalGetByID` fix

**Files:**
- Modify: `platform-app/services/user-service/internal/handlers/users.go`
- Create: `platform-app/services/user-service/internal/handlers/users_test.go`
- Create: `platform-app/infra/k8s/istio/authorization-policies/dev/authz-allow-internal-users.yaml`
- Create: `platform-app/infra/k8s/istio/authorization-policies/qa/authz-allow-internal-users.yaml`

**Interfaces:**
- Consumes: `repository.Repo` (Task 4), `middleware.GetTenantID`/`GetUserRole` (Task 5).
- Produces: `UserHandler` HTTP behavior per design spec §4.2 (List/Create scope by caller's tenant context; GetByID/Update/Delete/ChangePassword 404 on cross-tenant access; `InternalGetByID` no longer trusts a client-supplied `tenant_slug` param).

- [ ] **Step 1: Write the failing handler tests**

Create `users_test.go`:

```go
package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	appmw "github.com/itsm-cloudnative/user-service/internal/middleware"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"go.opentelemetry.io/otel"
)

func testUserHandler(t *testing.T) (*UserHandler, *repository.Repo) {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL must be set — skipping integration test")
	}
	ctx := context.Background()
	pool, err := appdb.NewPool(ctx, dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)

	repo := repository.New(pool)
	tracer := otel.Tracer("test")
	return NewUserHandler(repo, tracer), repo
}

// requestWithTenant builds a plain request carrying X-Tenant-ID (or none,
// for a platform-staff caller). Every test below routes the request through
// the real middleware.TenantRequired (see serveThroughMiddleware) rather
// than faking context values directly — TenantRequired's context key type
// is unexported, so there's no way to fake it from another package anyway,
// and going through the real middleware is more representative besides.
func requestWithTenant(method, path, tenant string, body []byte) *http.Request {
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	if tenant != "" {
		req.Header.Set("X-Tenant-ID", tenant)
	}
	return req
}

// serveThroughMiddleware wraps h with the real TenantRequired middleware so
// context values match production exactly.
func serveThroughMiddleware(h http.HandlerFunc, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	appmw.TenantRequired(h).ServeHTTP(w, req)
	return w
}

func mustCreateUser(t *testing.T, repo *repository.Repo, tenantID *string, role string) *models.User {
	t.Helper()
	suffix := t.Name()
	u, err := repo.Create(context.Background(), &models.User{
		Email:        "users-test-" + suffix + "-" + role + "@example.com",
		PasswordHash: "irrelevant",
		FullName:     "Users Test",
		Role:         role,
		TenantID:     tenantID,
	})
	if err != nil {
		t.Fatalf("mustCreateUser: %v", err)
	}
	t.Cleanup(func() { repo.Delete(context.Background(), u.ID) })
	return u
}

func strPtr(s string) *string { return &s }

func TestList_TenantScopedCallerSeesOnlyOwnTenant(t *testing.T) {
	h, repo := testUserHandler(t)
	ownTenantUser := mustCreateUser(t, repo, strPtr("customer_a"), "agent")
	otherTenantUser := mustCreateUser(t, repo, strPtr("customer_b"), "agent")

	req := requestWithTenant(http.MethodGet, "/api/v1/users", "customer_a", nil)
	w := serveThroughMiddleware(h.List, req)

	if w.Code != http.StatusOK {
		t.Fatalf("List() status = %d, body = %s", w.Code, w.Body.String())
	}
	var resp models.ListUsersResponse
	json.NewDecoder(w.Body).Decode(&resp)
	foundOwn := false
	for _, u := range resp.Users {
		if u.ID == ownTenantUser.ID {
			foundOwn = true
		}
		if u.ID == otherTenantUser.ID {
			t.Errorf("List(customer_a) unexpectedly returned a customer_b user")
		}
	}
	if !foundOwn {
		t.Errorf("List(customer_a) did not return the customer_a user")
	}
}

func TestList_PlatformCallerSeesOnlyPlatformStaff(t *testing.T) {
	h, repo := testUserHandler(t)
	platformUser := mustCreateUser(t, repo, nil, "platform_analyst")
	mustCreateUser(t, repo, strPtr("customer_c"), "agent")

	req := requestWithTenant(http.MethodGet, "/api/v1/users", "", nil) // no X-Tenant-ID
	w := serveThroughMiddleware(h.List, req)

	if w.Code != http.StatusOK {
		t.Fatalf("List() status = %d, body = %s", w.Code, w.Body.String())
	}
	var resp models.ListUsersResponse
	json.NewDecoder(w.Body).Decode(&resp)
	found := false
	for _, u := range resp.Users {
		if u.ID == platformUser.ID {
			found = true
		}
	}
	if !found {
		t.Errorf("List() for platform caller did not include the platform-staff user")
	}
}

func TestCreate_NewUserInheritsCallersTenant(t *testing.T) {
	h, repo := testUserHandler(t)

	body, _ := json.Marshal(models.CreateUserRequest{
		Email: "created-by-test-" + t.Name() + "@example.com", Password: "Password1!",
		FullName: "Created By Test", Role: "agent",
	})
	req := requestWithTenant(http.MethodPost, "/api/v1/users", "customer_a", body)
	w := serveThroughMiddleware(h.Create, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Create() status = %d, body = %s", w.Code, w.Body.String())
	}
	var created models.UserResponse
	json.NewDecoder(w.Body).Decode(&created)
	t.Cleanup(func() {
		ctx := context.Background()
		repo.Delete(ctx, created.ID)
	})
	// UserResponse doesn't expose TenantID (never has — see ToResponse),
	// so confirm indirectly: fetching it back as customer_a succeeds.
	getReq := requestWithTenant(http.MethodGet, "/api/v1/users/"+created.ID.String(), "customer_a", nil)
	getReq = withChiURLParam(getReq, "id", created.ID.String())
	getW := serveThroughMiddleware(h.GetByID, getReq)
	if getW.Code != http.StatusOK {
		t.Errorf("newly created user not visible to customer_a caller: status = %d", getW.Code)
	}
}

func TestGetByID_CrossTenantAccessReturns404(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "customer_b", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("GetByID() cross-tenant status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestGetByID_PlatformCallerCanAccessAnyTenant(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusOK {
		t.Errorf("GetByID() platform-caller status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
}

func TestGetByID_SameTenantAccessSucceeds(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "customer_a", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusOK {
		t.Errorf("GetByID() same-tenant status = %d, want %d", w.Code, http.StatusOK)
	}
}

// withChiURLParam injects a chi URL param the way the real router would —
// needed since these tests call handlers directly, bypassing chi's mux.
func withChiURLParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func TestInternalGetByID_NoLongerTakesTenantSlugParam(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	// No ?tenant_slug=... in the URL at all — the old param is gone.
	req := httptest.NewRequest(http.MethodGet, "/internal/users/"+target.ID.String(), nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := httptest.NewRecorder()
	h.InternalGetByID(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("InternalGetByID() status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/handlers/... -run 'TestList_|TestCreate_|TestGetByID_|TestInternalGetByID_' -v`
Expected: FAIL to compile — `h.repo.List(ctx, slug, ...)` /`FindByID(ctx, slug, id)` signature mismatches in the still-old `users.go`, and `InternalGetByID` still requires `tenant_slug`.

- [ ] **Step 3: Update `users.go`**

Replace the full content:

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/crypto/bcrypt"

	"github.com/itsm-cloudnative/user-service/internal/middleware"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
)

const bcryptCost = 12

// UserHandler handles all user CRUD endpoints.
// It reads tenant identity from context (populated by middleware.TenantRequired).
// An empty tenant ("") means the caller is platform staff — cross-tenant,
// not scoped to any single Customer App tenant.
type UserHandler struct {
	repo   *repository.Repo
	tracer trace.Tracer
}

func NewUserHandler(repo *repository.Repo, tracer trace.Tracer) *UserHandler {
	return &UserHandler{repo: repo, tracer: tracer}
}

// List godoc: GET /api/v1/users?limit=20&offset=0
// Platform staff (no tenant context) see other platform staff.
// Tenant-scoped callers see only their own tenant's users.
func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.list")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	limit := queryInt(r, "limit", 20)
	offset := queryInt(r, "offset", 0)
	if limit > 100 {
		limit = 100
	}

	users, total, err := h.repo.List(ctx, slug, limit, offset)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	resp := &models.ListUsersResponse{
		Users:  make([]*models.UserResponse, 0, len(users)),
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}
	for _, u := range users {
		resp.Users = append(resp.Users, u.ToResponse())
	}

	span.SetAttributes(attribute.Int("result.count", len(users)))
	writeJSON(w, http.StatusOK, resp)
}

// Create godoc: POST /api/v1/users
// The new user's tenant scope always matches the caller's own — a caller
// can never create a user in a different tenant than themselves.
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.create")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := validateCreateUser(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	var tenantID *string
	if slug != "" {
		tenantID = &slug
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		TenantID:     tenantID,
	}

	created, err := h.repo.Create(ctx, user)
	if errors.Is(err, repository.ErrEmailTaken) {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", created.ID.String()))
	span.AddEvent("user_created")
	writeJSON(w, http.StatusCreated, created.ToResponse())
}

// callerCanAccess reports whether a caller in tenant `callerTenant` (""
// meaning platform staff) may act on a user whose own tenant is `target`
// (nil meaning that user is themselves platform staff).
func callerCanAccess(callerTenant string, target *string) bool {
	if callerTenant == "" {
		return true // platform staff can access anyone
	}
	return target != nil && *target == callerTenant
}

// GetByID godoc: GET /api/v1/users/{id}
func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.get")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	span.SetAttributes(attribute.String("user.id", id.String()))

	user, err := h.repo.FindByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if !callerCanAccess(slug, user.TenantID) {
		// 404, not 403 — don't confirm the ID exists in another tenant.
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

// Update godoc: PUT /api/v1/users/{id}
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.update")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	existing, err := h.repo.FindByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if !callerCanAccess(slug, existing.TenantID) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Role != nil {
		if !validRole(*req.Role) {
			writeError(w, http.StatusBadRequest, "invalid role")
			return
		}
	}

	updated, err := h.repo.Update(ctx, id, &req)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", id.String()))
	span.AddEvent("user_updated")
	writeJSON(w, http.StatusOK, updated.ToResponse())
}

// Delete godoc: DELETE /api/v1/users/{id}
func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.delete")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	existing, err := h.repo.FindByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if !callerCanAccess(slug, existing.TenantID) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	if err := h.repo.Delete(ctx, id); errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	} else if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", id.String()))
	span.AddEvent("user_deleted")
	w.WriteHeader(http.StatusNoContent)
}

// ChangePassword godoc: PUT /api/v1/users/{id}/password
func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.change_password")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "current_password and new_password are required")
		return
	}
	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "new_password must be at least 8 characters")
		return
	}

	user, err := h.repo.FindByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if !callerCanAccess(slug, user.TenantID) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		span.SetStatus(codes.Error, "wrong current password")
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcryptCost)
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := h.repo.UpdatePassword(ctx, id, string(newHash)); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.AddEvent("password_changed")
	w.WriteHeader(http.StatusNoContent)
}

// InternalGetByID is the service-to-service endpoint used by Notification Service.
// GET /internal/users/{id}
//
// No X-Tenant-ID middleware, and no longer takes a caller-supplied
// tenant_slug — that was the 2026-08-15 finding (client-controlled query
// param, no real authorization). Authorization now comes entirely from the
// Istio AuthorizationPolicy restricting which service accounts can reach
// /internal/* at all (see infra/k8s/istio/authorization-policies/{dev,qa}/
// authz-allow-internal-users.yaml) — this handler trusts that only
// notification-service's mTLS identity can ever reach it, same trust
// boundary every other mesh-internal-only endpoint in this codebase relies on.
func (h *UserHandler) InternalGetByID(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.internal_get")
	defer span.End()

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	span.SetAttributes(attribute.String("user.id", id.String()))

	user, err := h.repo.FindByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

// ── shared helpers ────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func parseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, param))
}

func queryInt(r *http.Request, key string, defaultVal int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return defaultVal
	}
	return n
}

func validRole(role string) bool {
	switch role {
	case "admin", "agent", "viewer", "platform_admin", "platform_analyst":
		return true
	default:
		return false
	}
}

func validateCreateUser(req *models.CreateUserRequest) error {
	if req.Email == "" {
		return errors.New("email is required")
	}
	if req.Password == "" || len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if req.FullName == "" {
		return errors.New("full_name is required")
	}
	if !validRole(req.Role) {
		return errors.New("invalid role")
	}
	return nil
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/handlers/... -v`
Expected: all tests in both `auth_test.go` and `users_test.go` `PASS`. If the `var _ = rsa.GenerateKey` / `var _ = rand.Reader` lines from Step 1 trip an unused-import lint (they won't fail `go test`, only `golangci-lint`), remove them and their now-unused imports.

- [ ] **Step 5: Build and vet the whole service**

Run: `go build ./... && gofmt -l . && go vet ./...`
Expected: `go build` succeeds with no errors anywhere now (this was the last file with a stale signature). `gofmt -l .` prints nothing. `go vet ./...` prints nothing.

- [ ] **Step 6: Write the Istio AuthorizationPolicy fixing the IDOR**

`platform-app/infra/k8s/istio/authorization-policies/dev/authz-allow-internal-users.yaml`:

```yaml
# AuthorizationPolicy — restrict /internal/users/* to notification-service's
# own mTLS identity. Closes the 2026-08-15 finding: InternalGetByID took
# tenant_slug from an unauthenticated query param and had no real caller
# authorization ("protected by Istio mTLS" only proves transport identity,
# not who the caller is). Combined with users.go no longer accepting a
# caller-supplied tenant_slug at all (see Task 7), this is the actual fix —
# both the network layer AND the application layer are correct now.

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-internal-users-from-notification-service
  namespace: itsm-dev
spec:
  selector:
    matchLabels:
      app: user-service
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/itsm-dev/sa/notification-service"]
      to:
        - operation:
            paths: ["/internal/users/*"]
    - from:
        - source:
            notRequestPrincipals: ["*"]
      to:
        - operation:
            notPaths: ["/internal/users/*"]
      # Everything that ISN'T /internal/* keeps working exactly as before
      # (still gated by itsm-jwt-auth's RequestAuthentication + the existing
      # deny-unauthenticated-api policy) — this rule exists only so adding
      # this ALLOW policy doesn't accidentally start requiring a service
      # -account principal on every other user-service route too, which is
      # how Istio AuthorizationPolicy ALLOW rules work once any exist for a
      # workload (default-deny for anything unmatched).
```

`platform-app/infra/k8s/istio/authorization-policies/qa/authz-allow-internal-users.yaml`:

```yaml
# See dev/authz-allow-internal-users.yaml for the full rationale.

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-internal-users-from-notification-service
  namespace: itsm-qa
spec:
  selector:
    matchLabels:
      app: user-service
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/itsm-qa/sa/notification-service"]
      to:
        - operation:
            paths: ["/internal/users/*"]
    - from:
        - source:
            notRequestPrincipals: ["*"]
      to:
        - operation:
            notPaths: ["/internal/users/*"]
```

- [ ] **Step 7: Validate the YAML locally**

```bash
python3 -c "import yaml; yaml.safe_load(open('platform-app/infra/k8s/istio/authorization-policies/dev/authz-allow-internal-users.yaml')); yaml.safe_load(open('platform-app/infra/k8s/istio/authorization-policies/qa/authz-allow-internal-users.yaml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 8: Note for the user — applying this to the live cluster**

This YAML only takes effect once applied. That happens on the K8s master, not this Mac (per Global Constraints). Leave this as a note for the user to run themselves once they've reviewed the diff:

```bash
# On kubernetes-master, from /home/motadata/itsm-cloudnative-demo-app, after pulling this change:
kubectl apply -f platform-app/infra/k8s/istio/authorization-policies/dev/authz-allow-internal-users.yaml
```

- [ ] **Step 9: Commit**

```bash
git add platform-app/services/user-service/internal/handlers/users.go \
        platform-app/services/user-service/internal/handlers/users_test.go \
        platform-app/infra/k8s/istio/authorization-policies/dev/authz-allow-internal-users.yaml \
        platform-app/infra/k8s/istio/authorization-policies/qa/authz-allow-internal-users.yaml
```

---

### Task 8: Frontend — drop the "Workspace" field

**Files:**
- Modify: `platform-app/services/frontend/src/pages/Login.tsx`
- Modify: `platform-app/services/frontend/src/pages/Login.test.tsx`
- Modify: `platform-app/services/frontend/src/lib/types.ts`

**Interfaces:**
- Consumes: `authApi.login` (unchanged function signature — `platform-app/services/frontend/src/lib/api.ts` already just forwards whatever body it's given, no change needed there).
- Produces: `LoginRequest` type without `tenant_slug`; `JWTClaims.tenant_id` becomes optional; `JWTClaims.role` union expands.

- [ ] **Step 1: Update the failing test first**

In `Login.test.tsx`, the existing tests already don't reference the Workspace field directly (they use `getByPlaceholderText`, not the workspace input), so no changes are needed there — but add one new test asserting the field is gone and the submitted body has no `tenant_slug`:

Add to the `describe('Login page', ...)` block:

```tsx
  it('does not render a Workspace/tenant field', () => {
    renderLogin()
    expect(screen.queryByLabelText(/workspace/i)).not.toBeInTheDocument()
  })

  it('submits login without a tenant_slug field', async () => {
    const loginSpy = vi.spyOn(api.authApi, 'login').mockResolvedValue({ mfa_required: true, session_id: 'sess-xyz' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alice.admin@globaltech.io' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({ email: 'alice.admin@globaltech.io', password: 'Password1!' })
    })
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `cd platform-app/services/frontend && npx vitest run src/pages/Login.test.tsx`
Expected: FAIL — `does not render a Workspace/tenant field` fails because the field still exists; `submits login without a tenant_slug field` fails because the actual call includes `tenant_slug`.

- [ ] **Step 3: Update `types.ts`**

```ts
export interface JWTClaims {
  sub: string;           // user ID
  email: string;
  role: "admin" | "agent" | "viewer" | "platform_admin" | "platform_analyst";
  tenant_id?: string;    // absent for platform staff (cross-tenant)
  exp: number;           // Unix timestamp
}
```

```ts
export interface LoginRequest {
  email: string;
  password: string;
}
```

(Only these two interfaces change; everything else in `types.ts` is untouched.)

- [ ] **Step 4: Update `Login.tsx`**

Remove the `tenantSlug` state and the Workspace field:

```tsx
export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    loginMutation.mutate({ email, password })
  }
```

And remove this whole block from the JSX (the first `<div>` inside `<form onSubmit={handleSubmit} className="col gap-3">`):

```tsx
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
```

Nothing else in the file changes.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/pages/Login.test.tsx`
Expected: all tests `PASS`, including the two new ones.

- [ ] **Step 6: Run the full frontend test suite and typecheck to confirm nothing else broke**

Run: `npm run type-check && npx vitest run`
Expected: no type errors; all existing tests still pass (in particular `LoginMfa.test.tsx`, which doesn't touch the tenant field and shouldn't be affected).

- [ ] **Step 7: Commit**

```bash
git add platform-app/services/frontend/src/pages/Login.tsx \
        platform-app/services/frontend/src/pages/Login.test.tsx \
        platform-app/services/frontend/src/lib/types.ts
```

---

## Final verification (all tasks complete)

- [ ] Run the full backend suite once more end to end: `cd platform-app/services/user-service && gofmt -l . && go vet ./... && go build ./... && go test ./... -v` (with `DATABASE_URL`/`REDIS_URL` sourced) — expect clean output, 0 failures.
- [ ] Run the full frontend suite once more: `cd platform-app/services/frontend && npm run type-check && npx vitest run` — expect 0 failures.
- [ ] `git status` in the repo root — confirm only the files listed across Tasks 1–8 are staged, nothing else picked up accidentally.
- [ ] Remind the user: nothing has been deployed to the actual cluster yet. The Istio AuthorizationPolicy from Task 7 needs `kubectl apply` on `kubernetes-master` (Task 7 Step 8's command), and the migration/seed from Tasks 1–2 need re-running against whatever `DATABASE_URL` the dev cluster's pods actually use if that differs from what was used for local verification (it shouldn't — same external Postgres instance — but worth the user double-checking before considering this "live").

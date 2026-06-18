# Data Model

Synap uses PostgreSQL 16 with a **schema-per-tenant** isolation model. One database (`itsm`) contains a `public` schema for shared platform data and separate schemas for each tenant (`tenant_a`, `tenant_b`, `tenant_c`).

---

## Schema Layout

```
itsm (database)
├── public
│   └── tenants                    ← tenant registry (shared)
├── tenant_a
│   ├── users
│   ├── assets
│   ├── incidents
│   ├── incident_events
│   ├── asset_embeddings           ← Phase 7 (AI)
│   └── incident_ai_analysis       ← Phase 7 (AI)
├── tenant_b
│   └── (same tables as tenant_a)
└── tenant_c
    └── (same tables as tenant_a)
```

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    TENANTS {
        string slug PK "e.g. tenant_a"
        string display_name "e.g. GlobalTech"
        string status "active | suspended"
        timestamptz created_at
    }

    USERS {
        string id PK "e.g. u1000001"
        string email UK
        string password_hash
        string role "admin | agent | viewer"
        boolean mfa_enabled
        timestamptz created_at
        timestamptz updated_at
    }

    ASSETS {
        string id PK "e.g. a1000001"
        string name
        string asset_type "server | laptop | network | software | other"
        string status "active | inactive | decommissioned"
        jsonb metadata
        string created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    INCIDENTS {
        string id PK "e.g. i1000001"
        string title
        text description
        string status "open | assigned | in_progress | resolved | closed"
        string priority "P1 | P2 | P3 | P4"
        string assigned_to FK
        string created_by FK
        string related_asset_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz resolved_at
    }

    INCIDENT_EVENTS {
        string id PK
        string incident_id FK
        string event_type "status_change | comment | assignment | escalation"
        string actor_id FK
        jsonb payload
        timestamptz occurred_at
    }

    ASSET_EMBEDDINGS {
        string id PK
        string asset_id FK
        vector embedding "pgvector — 1536 dims"
        string model_version
        timestamptz created_at
    }

    INCIDENT_AI_ANALYSIS {
        string id PK
        string incident_id FK
        string suggested_priority "P1 | P2 | P3 | P4"
        text reasoning
        jsonb similar_incidents
        float confidence_score
        string model_version
        timestamptz analyzed_at
    }

    TENANTS ||--o{ USERS : "tenant schema"
    TENANTS ||--o{ ASSETS : "tenant schema"
    TENANTS ||--o{ INCIDENTS : "tenant schema"
    USERS ||--o{ INCIDENTS : "assigned_to / created_by"
    ASSETS ||--o{ INCIDENTS : "related_asset_id"
    INCIDENTS ||--o{ INCIDENT_EVENTS : "incident_id"
    INCIDENTS ||--o{ INCIDENT_AI_ANALYSIS : "incident_id"
    ASSETS ||--o{ ASSET_EMBEDDINGS : "asset_id"
```

---

## Table Definitions

### public.tenants

The single shared table. All services validate the `X-Tenant-ID` header against this registry before setting `search_path`.

| Column | Type | Notes |
|---|---|---|
| slug | VARCHAR(50) PK | Matches K8s namespace name (e.g. `tenant_a`) |
| display_name | VARCHAR(200) | Human-readable name |
| status | VARCHAR(20) | `active` or `suspended` |
| created_at | TIMESTAMPTZ | Default: `now()` |

### users (per-tenant schema)

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | Format: `u{7-digits}` e.g. `u1000001` |
| email | VARCHAR(255) UNIQUE | Login identifier |
| password_hash | TEXT | bcrypt (cost=12) |
| role | VARCHAR(20) | `admin`, `agent`, or `viewer` |
| mfa_enabled | BOOLEAN | Default: `false` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### assets (per-tenant schema)

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | Format: `a{7-digits}` |
| name | VARCHAR(200) | |
| asset_type | VARCHAR(50) | `server`, `laptop`, `network`, `software`, `other` |
| status | VARCHAR(30) | `active`, `inactive`, `decommissioned` |
| metadata | JSONB | Flexible key-value pairs (serial, location, etc.) |
| created_by | VARCHAR(20) FK → users.id | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes:** GIN on `metadata`, `pg_trgm` on `name` (full-text search)

### incidents (per-tenant schema)

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | Format: `i{7-digits}` |
| title | VARCHAR(500) | |
| description | TEXT | |
| status | VARCHAR(30) | `open` → `assigned` → `in_progress` → `resolved` → `closed` |
| priority | VARCHAR(5) | `P1` (Critical), `P2` (High), `P3` (Medium), `P4` (Low) |
| assigned_to | VARCHAR(20) FK → users.id | Nullable |
| created_by | VARCHAR(20) FK → users.id | |
| related_asset_id | VARCHAR(20) FK → assets.id | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| resolved_at | TIMESTAMPTZ | Nullable; set when status → resolved |

**Indexes:** btree on `status`, `priority`, `created_at`; `pg_trgm` on `title`

### incident_events (per-tenant schema)

Append-only audit trail. Records every state transition and comment on an incident.

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | |
| incident_id | VARCHAR(20) FK → incidents.id | |
| event_type | VARCHAR(50) | `status_change`, `comment`, `assignment`, `escalation` |
| actor_id | VARCHAR(20) FK → users.id | Who performed the action |
| payload | JSONB | Event-specific data (e.g. `{ "from": "open", "to": "assigned" }`) |
| occurred_at | TIMESTAMPTZ | Default: `now()` |

### asset_embeddings (per-tenant schema — Phase 7)

Stores pgvector embeddings for semantic asset search.

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | |
| asset_id | VARCHAR(20) FK → assets.id | |
| embedding | VECTOR(1536) | pgvector — OpenAI text-embedding-3-small dimensions |
| model_version | VARCHAR(50) | e.g. `text-embedding-3-small` |
| created_at | TIMESTAMPTZ | |

### incident_ai_analysis (per-tenant schema — Phase 7)

Stores AI triage results for incidents.

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | |
| incident_id | VARCHAR(20) FK → incidents.id | |
| suggested_priority | VARCHAR(5) | AI-recommended priority |
| reasoning | TEXT | LLM explanation |
| similar_incidents | JSONB | Array of similar incident IDs + similarity scores |
| confidence_score | FLOAT | 0.0–1.0 |
| model_version | VARCHAR(50) | LLM model identifier |
| analyzed_at | TIMESTAMPTZ | |

---

## Migration Strategy

Migrations use `golang-migrate v4`. Files are in `database/migrations/`.

**File naming:** `{6-digit-sequence}_{description}.up.sql` / `.down.sql`
```
database/migrations/
├── 000001_init_schema.up.sql          ← public.tenants + extensions
├── 000001_init_schema.down.sql
├── 000002_tenant_schemas.up.sql       ← users, assets, incidents tables
├── 000002_tenant_schemas.down.sql
├── 000003_incident_events.up.sql      ← append-only audit trail
├── 000003_incident_events.down.sql
└── 000004_ai_tables.up.sql            ← Phase 7: embeddings + analysis
```

**Run migrations:**
```bash
export DATABASE_URL=postgres://itsm:itsm@172.16.13.168:5432/itsm?sslmode=disable
migrate -database "$DATABASE_URL" -path database/migrations up
```

---

## PostgreSQL Extensions Required

| Extension | Purpose | Enabled In |
|---|---|---|
| `pgcrypto` | `gen_random_uuid()`, `crypt()` for password hashing | `public` schema |
| `pg_trgm` | Trigram full-text search on name/title fields | `public` schema |
| `pgvector` | Vector similarity search for AI embeddings | `public` schema (Phase 7) |

---

## Connection Handling

Services use async connection pools (pgx for Go, asyncpg for Python). The `search_path` is set at the start of each request handler, not in the DSN.

**Python (SQLAlchemy 2.x async):**
```python
async with db.begin():
    await db.execute(text(f"SET search_path = {tenant_slug}, public"))
    result = await db.execute(select(Incident).where(...))
```

**Go (pgx/v5):**
```go
conn, _ := pool.Acquire(ctx)
defer conn.Release()
conn.Exec(ctx, fmt.Sprintf("SET search_path = %s, public", tenantSlug))
// queries run within this connection...
```

> The tenant slug comes from the `X-Tenant-ID` header injected by Istio. It is validated against `public.tenants.slug` before use to prevent `search_path` injection.

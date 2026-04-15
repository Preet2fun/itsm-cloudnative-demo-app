# Database Schema Diagram

## Overview

Single PostgreSQL 16 instance. `public` schema holds shared cross-tenant data. Each tenant has its own schema (`tenant_a`, `tenant_b`, `tenant_c`) with identical table structures.

---

## Schema Layout

```
PostgreSQL Instance
│
├── public                          (shared)
│   └── tenants
│
├── tenant_a                        (tenant-a isolated data)
│   ├── users
│   ├── assets
│   ├── incidents
│   ├── incident_events
│   ├── asset_embeddings            (Phase 7)
│   └── incident_ai_analysis        (Phase 7)
│
├── tenant_b                        (identical structure)
└── tenant_c                        (identical structure)
```

---

## Entity Relationships

```
public.tenants
    │ (1)
    │  (referenced by JWT tenant_id claim — no FK across schemas)
    │
    ├──▶ tenant_a.users (1)────────────────────────────────┐
    │         │                                             │
    │         │ owner_user_id (FK)      assignee/reporter  │
    │         ▼                              │              │
    │    tenant_a.assets (1)                │              │
    │         │                             │              │
    │         │ affected_asset_id (FK)      │              │
    │         ▼                             ▼              │
    │    tenant_a.incidents ◀──────────────────────────────┘
    │         │ (1)
    │         │ incident_id (FK)
    │         ▼
    │    tenant_a.incident_events
    │
    │    tenant_a.asset_embeddings ──▶ asset_id FK → tenant_a.assets
    └──  tenant_a.incident_ai_analysis ──▶ incident_id FK → tenant_a.incidents
```

---

## Table Definitions

### `public.tenants`
Tenant registry — one row per tenant.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | Tenant identifier |
| `name` | TEXT | NOT NULL | Display name (e.g. "Acme Corp") |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe identifier (e.g. "tenant-a") |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |
| `is_active` | BOOL | NOT NULL, default true | Soft-disable a tenant |

---

### `tenant_<slug>.users`
All users for a tenant. Passwords are bcrypt-hashed.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | User identifier |
| `email` | TEXT | UNIQUE, NOT NULL | Login email |
| `password_hash` | TEXT | NOT NULL | bcrypt hash |
| `full_name` | TEXT | NOT NULL | Display name |
| `role` | TEXT | CHECK IN ('admin','agent','viewer') | RBAC role |
| `is_active` | BOOL | NOT NULL, default true | Account enabled/disabled |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Updated by trigger |
| `last_login_at` | TIMESTAMPTZ | NULLABLE | Set on successful login |

**Indexes:** `email` (unique), `role`

---

### `tenant_<slug>.assets`
Hardware, software, and network assets (CMDB-lite).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Asset identifier |
| `name` | TEXT | NOT NULL | Asset name |
| `type` | TEXT | CHECK IN ('hardware','software','network') | Asset category |
| `status` | TEXT | CHECK IN ('active','retired','maintenance') | Current status |
| `serial_number` | TEXT | NULLABLE | Hardware serial / software licence key |
| `owner_user_id` | UUID | FK → users.id, NULLABLE | Assigned owner |
| `location` | TEXT | NULLABLE | Physical location or cloud region |
| `metadata` | JSONB | NULLABLE, default '{}' | Flexible extra attributes |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Updated by trigger |

**Indexes:** `type`, `status`, `owner_user_id`

**Example `metadata` values:**
```json
{ "ip": "192.168.1.10", "os": "Ubuntu 22.04", "cpu_cores": 8 }
{ "version": "3.11.2", "licence_expiry": "2027-01-01" }
```

---

### `tenant_<slug>.incidents`
Core incident lifecycle table.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Incident identifier |
| `title` | TEXT | NOT NULL | Short summary |
| `description` | TEXT | NULLABLE | Full description |
| `priority` | TEXT | CHECK IN ('P1','P2','P3','P4'), NOT NULL | P1=critical, P4=low |
| `status` | TEXT | CHECK IN ('open','in_progress','resolved','closed') | Lifecycle state |
| `assignee_user_id` | UUID | FK → users.id, NULLABLE | Assigned agent |
| `reporter_user_id` | UUID | FK → users.id, NOT NULL | Who raised the incident |
| `affected_asset_id` | UUID | FK → assets.id, NULLABLE | Linked asset |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | Set when status → resolved |
| `resolution_notes` | TEXT | NULLABLE | How it was fixed |
| `tags` | JSONB | NULLABLE, default '[]' | e.g. `["network","prod"]` |

**Indexes:** `priority`, `status`, `assignee_user_id`, `affected_asset_id`, `created_at DESC`

**SLA targets (for OTel tracking):**

| Priority | Resolution SLA |
|---|---|
| P1 | 1 hour |
| P2 | 4 hours |
| P3 | 24 hours |
| P4 | 72 hours |

---

### `tenant_<slug>.incident_events`
Append-only audit log of all changes to an incident.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Event identifier |
| `incident_id` | UUID | FK → incidents.id, NOT NULL | Parent incident |
| `event_type` | TEXT | NOT NULL | e.g. `status_changed`, `assigned`, `commented`, `priority_changed` |
| `payload` | JSONB | NOT NULL, default '{}' | Event-specific data |
| `actor_user_id` | UUID | FK → users.id, NULLABLE | User who triggered the event |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes:** `incident_id`, `created_at DESC`

**Example payloads:**
```json
// status_changed
{ "from": "open", "to": "in_progress" }

// assigned
{ "from": null, "to": "user-uuid", "to_name": "Alice" }

// commented
{ "text": "Rebooted the server — monitoring." }

// priority_changed
{ "from": "P3", "to": "P1", "reason": "Customer impact confirmed" }
```

---

### `tenant_<slug>.asset_embeddings` (Phase 7)
Vector embeddings for semantic asset search.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `asset_id` | UUID | FK → assets.id, UNIQUE | One embedding per asset |
| `embedding` | vector(384) | NOT NULL | 384-dim float32 vector (all-MiniLM-L6-v2) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Index:** `ivfflat` index on `embedding` using cosine distance for fast ANN search

---

### `tenant_<slug>.incident_ai_analysis` (Phase 7)
Stores AI triage results per incident.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `incident_id` | UUID | FK → incidents.id | Parent incident |
| `triage_result` | JSONB | NOT NULL | Structured LLM output (priority, assignee_role, hypothesis, actions) |
| `confidence_score` | FLOAT | NULLABLE | 0.0–1.0 model confidence |
| `model_used` | TEXT | NOT NULL | LLM model identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

---

## Migration Strategy

Migrations use `golang-migrate` v4 with SQL files numbered sequentially:

```
V1__init_schema.sql         → public.tenants table
V2__tenant_schema.sql       → create_tenant_schema() stored procedure
V3__assets.sql              → assets table definition
V4__users.sql               → users table definition
V5__incidents.sql           → incidents + incident_events tables
```

**Tenant schema creation:** Calling `SELECT create_tenant_schema('tenant_a')` creates all tables in the `tenant_a` schema. It is idempotent — safe to call multiple times.

**Future migrations** follow the same sequential numbering (V6, V7...) and are applied via `golang-migrate up`.

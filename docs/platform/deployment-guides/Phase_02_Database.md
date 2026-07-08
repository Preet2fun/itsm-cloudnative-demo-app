# Phase 2 Deployment Guide — Database Layer

## Overview

In this phase you install PostgreSQL 16 as a **standalone service** on a dedicated
machine (not inside K8s), run all versioned migrations via `golang-migrate`, create
the three tenant schemas, and load seed data.

```
Your Laptop ──── K8s Cluster (3 nodes)
                      │
                      │  TCP 5432
                      ▼
              DB Machine (standalone PostgreSQL 16)
                  ├── public schema  → tenants registry
                  ├── tenant_a schema → GlobalTech data
                  ├── tenant_b schema → RetailEdge data
                  └── tenant_c schema → StartupNest data
```

---

## Prerequisites

| Tool | Where | Check |
|---|---|---|
| PostgreSQL 16 client (`psql`) | your laptop | `psql --version` |
| `golang-migrate` CLI | your laptop | `migrate --version` |
| Bash 4+ | your laptop | `bash --version` |
| SSH access | to DB machine | `ssh user@<machine-ip>` |

---

## Step 1 — Install PostgreSQL 16 on the DB machine

SSH into the database machine first:

```bash
$ ssh user@<machine-ip>
```

### Ubuntu 22.04 / 24.04

```bash
[db-machine]$ sudo apt update
[db-machine]$ sudo apt install -y curl ca-certificates

# Add PostgreSQL official apt repository
[db-machine]$ sudo install -d /usr/share/postgresql-common/pgdg
[db-machine]$ sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc

[db-machine]$ sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
    https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list'

[db-machine]$ sudo apt update
[db-machine]$ sudo apt install -y postgresql-16

# Verify
[db-machine]$ psql --version
# Expected: psql (PostgreSQL) 16.x
```

### RHEL 9 / Rocky Linux 9

```bash
[db-machine]$ sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
[db-machine]$ sudo dnf -qy module disable postgresql
[db-machine]$ sudo dnf install -y postgresql16-server postgresql16
[db-machine]$ sudo /usr/pgsql-16/bin/postgresql-16-setup initdb
[db-machine]$ sudo systemctl enable --now postgresql-16
```

---

## Step 2 — Create the database user and database

```bash
[db-machine]$ sudo -u postgres psql <<'EOF'
-- Application user
CREATE USER itsm WITH PASSWORD 'itsm';

-- Main database
CREATE DATABASE itsm OWNER itsm;

-- Grant
GRANT ALL PRIVILEGES ON DATABASE itsm TO itsm;

-- Allow itsm user to create schemas (required for create_tenant_schema())
ALTER USER itsm CREATEDB;

\q
EOF
```

> **Security note for QA:** replace `itsm` password with a strong random string and
> store it in a K8s Secret. Update `DATABASE_URL` in `.env` accordingly.

---

## Step 3 — Allow remote connections from K8s nodes

By default PostgreSQL only listens on `localhost`. You need to open it to your K8s
node IP range.

### 3a — Set listen address

```bash
[db-machine]$ sudo nano /etc/postgresql/16/main/postgresql.conf
# Find and change:
listen_addresses = '*'
```

### 3b — Allow connections in pg_hba.conf

```bash
[db-machine]$ sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line at the end (replace 192.168.x.0/24 with your K8s node subnet):
host    itsm    itsm    192.168.x.0/24    scram-sha-256

# Also allow from your laptop's IP for running scripts:
host    itsm    itsm    <your-laptop-ip>/32    scram-sha-256
```

### 3c — Restart PostgreSQL

```bash
[db-machine]$ sudo systemctl restart postgresql

# Verify it is listening on all interfaces
[db-machine]$ ss -tlnp | grep 5432
# Expected: 0.0.0.0:5432
```

### 3d — Open firewall port (if UFW is active)

```bash
[db-machine]$ sudo ufw allow from 192.168.x.0/24 to any port 5432
[db-machine]$ sudo ufw allow from <your-laptop-ip> to any port 5432
[db-machine]$ sudo ufw reload
```

---

## Step 4 — Set DATABASE_URL in your .env

Back on your **laptop**:

```bash
$ nano .env
```

Update the `DATABASE_URL` line:

```
DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable
```

Replace `<machine-ip>` with the actual IP address of the DB machine.

### Verify connectivity from laptop

```bash
$ export $(grep DATABASE_URL .env | xargs)
$ psql "${DATABASE_URL}" -c "SELECT version();"
# Expected: PostgreSQL 16.x ...
```

---

## Step 5 — Install golang-migrate CLI

`golang-migrate` runs all the `.up.sql` files in `database/migrations/` in order.

### macOS

```bash
$ brew install golang-migrate
$ migrate --version
# Expected: 4.x.x
```

### Linux / Ubuntu

```bash
$ curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.1/migrate.linux-amd64.tar.gz \
  | tar xvz
$ sudo mv migrate /usr/local/bin/
$ migrate --version
```

---

## Step 6 — Run migrations

From the repo root on your **laptop**:

```bash
$ export $(grep DATABASE_URL .env | xargs)

$ migrate \
    -path database/migrations \
    -database "${DATABASE_URL}" \
    up
```

Expected output:

```
1/u init_schema (XXms)
2/u tenant_schema_function (XXms)
3/u tenant_indexes (XXms)
4/u updated_at_triggers (XXms)
5/u phase7_ai_stubs (XXms)
```

### Verify migrations ran

```bash
$ psql "${DATABASE_URL}" -c "SELECT version, dirty FROM schema_migrations ORDER BY version;"
```

Expected:

```
 version | dirty
---------+-------
       1 | f
       2 | f
       3 | f
       4 | f
       5 | f
```

### Verify public.tenants table exists

```bash
$ psql "${DATABASE_URL}" -c "\dt public.*"
# Expected: public.tenants
```

---

## Step 7 — Create tenant schemas and seed data

```bash
$ export $(grep DATABASE_URL .env | xargs)
$ export $(grep "^ENV=" .env | xargs)

# Create all three tenant schemas AND load seed data in one command:
$ SEED=true bash scripts/create-tenants.sh
```

Expected output (abbreviated):

```
==> create-tenants.sh  [ENV=dev]
--> Testing database connectivity...
    Connected to <machine-ip>:5432/itsm

--> Processing tenant: tenant_a
    Creating schema 'tenant_a'...
    Attaching updated_at triggers...
    Adding AI stub tables...
    Adding trigram search indexes...
    Schema 'tenant_a' ready.
    Seeding data from .../seeds/seed-tenant-a.sql...
    Seed complete.

--> Processing tenant: tenant_b
    ...

--> Processing tenant: tenant_c
    ...

==> All tenants processed successfully.

    Registered tenants:
                  id                  |         name         |   slug   | is_active |         created_at
--------------------------------------+----------------------+----------+-----------+----------------------------
 a0000000-0000-0000-0000-000000000001 | GlobalTech Solutions | tenant_a | t         | 2026-04-14 ...
 b0000000-0000-0000-0000-000000000001 | RetailEdge Corp      | tenant_b | t         | 2026-04-14 ...
 c0000000-0000-0000-0000-000000000001 | StartupNest Ltd      | tenant_c | t         | 2026-04-14 ...
```

---

## Step 8 — Connect a GUI and verify data

Use **DBeaver** (free) or **TablePlus** (Mac, freemium):

**Connection settings:**
```
Host:     <machine-ip>
Port:     5432
Database: itsm
Username: itsm
Password: itsm
```

**What to verify in the GUI:**

1. **Schemas** — you should see: `public`, `tenant_a`, `tenant_b`, `tenant_c`

2. **public.tenants** — 3 rows (GlobalTech, RetailEdge, StartupNest)

3. **tenant_a tables** — expand `tenant_a` schema:
   - `users` → 10 rows
   - `assets` → 20 rows
   - `incidents` → 15 rows
   - `incident_events` → 13 rows
   - `asset_embeddings` → 0 rows (stub)
   - `incident_ai_analysis` → 0 rows (stub)

4. **Indexes** — under `tenant_a.incidents`, verify GIN indexes for `title` and `description` exist

5. **Triggers** — run in DBeaver SQL editor:
   ```sql
   SELECT trigger_name, event_object_schema, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'tenant_a'
   ORDER BY event_object_table;
   ```
   Should list 3 triggers (`users`, `assets`, `incidents`).

6. **Isolation test** — run:
   ```sql
   -- tenant_a has 15 incidents
   SET search_path TO tenant_a;
   SELECT COUNT(*) FROM incidents;   -- expect 15

   -- tenant_c has 3 incidents
   SET search_path TO tenant_c;
   SELECT COUNT(*) FROM incidents;   -- expect 3

   -- Cross-schema access is blocked:
   SET search_path TO tenant_c;
   SELECT * FROM tenant_a.incidents; -- expect: permission denied (if row-level security added later)
   -- For now schemas are not permission-isolated at DB level; that isolation is enforced at app layer via search_path
   ```

---

## Step 9 — Apply K8s namespaces

These namespaces must exist before any Phase 3+ service is deployed.

```bash
$ kubectl apply -f infra/k8s/namespaces/dev/namespace-itsm-dev.yaml

# Verify
$ kubectl get namespace itsm-dev
# Expected: itsm-dev   Active   Xs
```

For QA (when needed):

```bash
$ kubectl apply -f infra/k8s/namespaces/qa/namespace-itsm-qa.yaml
```

---

## Rollback — undo migrations

If you need to tear down the database schema completely:

```bash
$ export $(grep DATABASE_URL .env | xargs)

# Roll back all 5 migrations
$ migrate \
    -path database/migrations \
    -database "${DATABASE_URL}" \
    down 5
```

> **Warning:** This drops all tenant schemas and all data. Do this only in dev.

---

## Troubleshooting

### `psql: could not connect to server: Connection refused`
- Check PostgreSQL is running: `[db-machine]$ systemctl status postgresql`
- Check `listen_addresses = '*'` in `postgresql.conf` and service restarted
- Check firewall: `[db-machine]$ sudo ufw status`

### `FATAL: password authentication failed for user "itsm"`
- Re-run Step 2 to reset the password
- Ensure `pg_hba.conf` uses `scram-sha-256` (not `peer` or `ident`)

### `migrate: error: Dirty database version X`
- A previous migration failed mid-way. Fix the SQL error, then:
  ```bash
  $ migrate -path database/migrations -database "${DATABASE_URL}" force X
  $ migrate -path database/migrations -database "${DATABASE_URL}" up
  ```

### `ERROR: function public.create_tenant_schema(unknown) does not exist`
- Migration 000002 did not apply. Check `schema_migrations` table.
- Re-run: `migrate ... up`

### `create-tenants.sh: ERROR: DATABASE_URL is not set`
- You forgot to export it: `export $(grep DATABASE_URL .env | xargs)`

---

## Phase 2 Acceptance Checklist

Copy these into your project management tool as acceptance criteria:

- [ ] PostgreSQL 16 installed and running on DB machine
- [ ] `psql "${DATABASE_URL}" -c "SELECT version();"` succeeds from laptop
- [ ] `psql "${DATABASE_URL}" -c "SELECT version();"` succeeds from K8s node (connectivity test)
- [ ] All 5 migrations applied — `schema_migrations` shows 5 rows, `dirty=f`
- [ ] `public.tenants` has 3 rows (tenant_a, tenant_b, tenant_c)
- [ ] `tenant_a.users` has 10 rows, `tenant_a.incidents` has 15 rows
- [ ] `tenant_b.users` has 10 rows, `tenant_b.incidents` has 15 rows
- [ ] `tenant_c.users` has 5 rows, `tenant_c.incidents` has 3 rows
- [ ] Trigram GIN indexes exist on `incidents.title`, `incidents.description` in all tenant schemas
- [ ] `updated_at` triggers exist on `users`, `assets`, `incidents` in all tenant schemas
- [ ] AI stub tables (`asset_embeddings`, `incident_ai_analysis`) exist with 0 rows
- [ ] GUI tool (DBeaver/TablePlus) connects and shows all schemas and tables
- [ ] `itsm-dev` K8s namespace created and active
- [ ] `DATABASE_URL` in `.env` pointing to external DB machine (not localhost)

#!/usr/bin/env bash
# Script: create-tenants.sh
# Description: Register tenants in the public.tenants table, create per-tenant
#              PostgreSQL schemas via create_tenant_schema(), apply updated_at
#              triggers & AI stubs for new schemas, then optionally seed data.
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
#     ENV=dev bash scripts/create-tenants.sh
#
#   DATABASE_URL=... ENV=dev SEED=true bash scripts/create-tenants.sh
#   DATABASE_URL=... ENV=dev TENANTS="tenant_d tenant_e" bash scripts/create-tenants.sh
#
# Required env vars:
#   DATABASE_URL — full Postgres connection string (copy from .env)
#   ENV          — dev | qa
#
# Optional env vars:
#   SEED         — true | false (default false)  seed baseline data after schema creation
#   TENANTS      — space-separated slugs (default: tenant_a tenant_b tenant_c)

set -euo pipefail

# ── Resolve environment ───────────────────────────────────────────────────────
ENV="${ENV:-dev}"
if [[ "${ENV}" != "dev" && "${ENV}" != "qa" ]]; then
  echo "ERROR: ENV must be 'dev' or 'qa', got '${ENV}'" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  Export it or prefix the command:" >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable ENV=dev bash scripts/create-tenants.sh" >&2
  exit 1
fi

echo "==> create-tenants.sh  [ENV=${ENV}]"

# ── Parse DATABASE_URL into psql connection flags ─────────────────────────────
# Supports: postgres://user:pass@host:port/dbname?options
_url="${DATABASE_URL#postgres://}"           # strip scheme
_userpass="${_url%%@*}"                      # user:pass
_hostdb="${_url##*@}"                        # host:port/dbname?...
_hostdb="${_hostdb%%\?*}"                    # strip query string
_host="${_hostdb%%:*}"                       # host
_portdb="${_hostdb#*:}"                      # port/dbname
_port="${_portdb%%/*}"                       # port
_dbname="${_portdb##*/}"                     # dbname
_user="${_userpass%%:*}"                     # user
_password="${_userpass##*:}"                 # password

export PGPASSWORD="${_password}"
PSQL="psql -h ${_host} -p ${_port} -U ${_user} -d ${_dbname} -v ON_ERROR_STOP=1"

SEED="${SEED:-false}"
TENANTS="${TENANTS:-tenant_a tenant_b tenant_c}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEEDS_DIR="${REPO_ROOT}/database/seeds"

# ── Verify connectivity ───────────────────────────────────────────────────────
echo "--> Testing database connectivity..."
${PSQL} -c "SELECT version();" > /dev/null
echo "    Connected to ${_host}:${_port}/${_dbname}"

# ── Process each tenant ───────────────────────────────────────────────────────
for SLUG in ${TENANTS}; do
  echo ""
  echo "--> Processing tenant: ${SLUG}"

  # 1. Create schema + core tables via stored procedure
  echo "    Creating schema '${SLUG}'..."
  ${PSQL} <<-SQL
    SELECT public.create_tenant_schema('${SLUG}');
SQL

  # 2. Attach updated_at triggers to new schema tables
  echo "    Attaching updated_at triggers..."
  ${PSQL} <<-SQL
    SELECT public.attach_updated_at_trigger('${SLUG}', 'users');
    SELECT public.attach_updated_at_trigger('${SLUG}', 'assets');
    SELECT public.attach_updated_at_trigger('${SLUG}', 'incidents');
SQL

  # 3. Add AI stub tables
  echo "    Adding AI stub tables..."
  ${PSQL} <<-SQL
    SELECT public.add_ai_stubs('${SLUG}');
SQL

  # 4. Add trigram indexes (requires pg_trgm extension from migration 000001)
  echo "    Adding trigram search indexes..."
  ${PSQL} <<-SQL
    CREATE INDEX IF NOT EXISTS ${SLUG}_users_fullname_trgm
        ON ${SLUG}.users USING gin(full_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS ${SLUG}_assets_name_trgm
        ON ${SLUG}.assets USING gin(name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS ${SLUG}_incidents_title_trgm
        ON ${SLUG}.incidents USING gin(title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS ${SLUG}_incidents_description_trgm
        ON ${SLUG}.incidents USING gin(description gin_trgm_ops);
SQL

  echo "    Schema '${SLUG}' ready."

  # 5. Optionally seed data
  if [[ "${SEED}" == "true" ]]; then
    SEED_FILE="${SEEDS_DIR}/seed-${SLUG//_/-}.sql"
    if [[ -f "${SEED_FILE}" ]]; then
      echo "    Seeding data from ${SEED_FILE}..."
      ${PSQL} -f "${SEED_FILE}"
      echo "    Seed complete."
    else
      echo "    WARNING: No seed file found at ${SEED_FILE} — skipping seed for ${SLUG}."
    fi
  fi

done

echo ""
echo "==> All tenants processed successfully."
echo ""
echo "    Registered tenants:"
${PSQL} -c "SELECT id, name, slug, is_active, created_at FROM public.tenants ORDER BY created_at;"

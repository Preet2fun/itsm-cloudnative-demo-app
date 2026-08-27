#!/usr/bin/env bash
# Script: create-customer-tenants.sh
# Description: Registers tenants in public.customer_tenants and creates
#              per-tenant PostgreSQL schemas via create_customer_tenant_schema(),
#              then optionally seeds data. Structural port of
#              platform-app/scripts/create-tenants.sh.
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
#     bash scripts/create-customer-tenants.sh
#
#   DATABASE_URL=... SEED=true bash scripts/create-customer-tenants.sh
#   DATABASE_URL=... TENANTS="customer_d customer_e" bash scripts/create-customer-tenants.sh
#
# Required env vars:
#   DATABASE_URL — full Postgres connection string
#
# Optional env vars:
#   SEED     — true | false (default false)
#   TENANTS  — space-separated slugs (default: customer_a customer_b customer_c)

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable bash scripts/create-customer-tenants.sh" >&2
  exit 1
fi

echo "==> create-customer-tenants.sh"

# ── Parse DATABASE_URL into psql connection flags ─────────────────────────────
_url="${DATABASE_URL#postgres://}"
_userpass="${_url%%@*}"
_hostdb="${_url##*@}"
_hostdb="${_hostdb%%\?*}"
_host="${_hostdb%%:*}"
_portdb="${_hostdb#*:}"
_port="${_portdb%%/*}"
_dbname="${_portdb##*/}"
_user="${_userpass%%:*}"
_password="${_userpass##*:}"

export PGPASSWORD="${_password}"
PSQL="psql -h ${_host} -p ${_port} -U ${_user} -d ${_dbname} -v ON_ERROR_STOP=1"

SEED="${SEED:-false}"
TENANTS="${TENANTS:-customer_a customer_b customer_c}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEEDS_DIR="${REPO_ROOT}/database/seeds"

echo "--> Testing database connectivity..."
${PSQL} -c "SELECT version();" > /dev/null
echo "    Connected to ${_host}:${_port}/${_dbname}"

for SLUG in ${TENANTS}; do
  echo ""
  echo "--> Processing tenant: ${SLUG}"

  # 1. Register the tenant. Neither create_tenant_schema() (Platform App) nor
  #    create_customer_tenant_schema() (this app) inserts a registry row
  #    itself — confirmed by reading both migration functions — so this
  #    script does it explicitly. This is a correction versus Platform App's
  #    own create-tenants.sh, which has the same gap unaddressed.
  echo "    Registering tenant '${SLUG}'..."
  ${PSQL} <<-SQL
    INSERT INTO public.customer_tenants (name, slug)
    VALUES ('${SLUG}', '${SLUG}')
    ON CONFLICT (slug) DO NOTHING;
SQL

  # 2. Create schema + all 5 tables via stored procedure
  echo "    Creating schema '${SLUG}'..."
  ${PSQL} <<-SQL
    SELECT public.create_customer_tenant_schema('${SLUG}');
SQL

  echo "    Schema '${SLUG}' ready."

  # 3. Optionally seed data
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
${PSQL} -c "SELECT id, name, slug, is_active, created_at FROM public.customer_tenants ORDER BY created_at;"

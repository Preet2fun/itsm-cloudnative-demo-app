#!/usr/bin/env bash
# Script: run-migrations.sh
# Description: Runs golang-migrate against customer-app's migrations,
#              tracked in its own schema_migrations table
#              (customer_app_schema_migrations) so it doesn't collide with
#              Platform App's default-named tracking table on the same
#              Postgres instance.
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
#     bash scripts/run-migrations.sh
#   DATABASE_URL=... bash scripts/run-migrations.sh down 1   # rollback N steps

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable bash scripts/run-migrations.sh" >&2
  exit 1
fi

if ! command -v migrate &> /dev/null; then
  echo "ERROR: golang-migrate CLI ('migrate') not found on PATH." >&2
  echo "  Install: https://github.com/golang-migrate/migrate" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/database/migrations"

# Append x-migrations-table as a query param — keeps this app's migration
# state isolated from Platform App's default-named tracking table without
# touching the shared DATABASE_URL variable itself.
SEP="&"
if [[ "${DATABASE_URL}" != *"?"* ]]; then
  SEP="?"
fi
MIGRATE_DATABASE_URL="${DATABASE_URL}${SEP}x-migrations-table=customer_app_schema_migrations"

ACTION="${1:-up}"
STEPS="${2:-}"

echo "==> run-migrations.sh [action=${ACTION}]"
echo "    path:     ${MIGRATIONS_DIR}"
echo "    table:    customer_app_schema_migrations"

if [[ -n "${STEPS}" ]]; then
  migrate -path "${MIGRATIONS_DIR}" -database "${MIGRATE_DATABASE_URL}" "${ACTION}" "${STEPS}"
else
  migrate -path "${MIGRATIONS_DIR}" -database "${MIGRATE_DATABASE_URL}" "${ACTION}"
fi

echo "==> Migrations complete."

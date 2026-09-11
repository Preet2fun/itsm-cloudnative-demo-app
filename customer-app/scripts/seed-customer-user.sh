#!/usr/bin/env bash
# Script: seed-customer-user.sh
# Description: Upserts one or more customer-app end-user login rows into the
#              shared public.users table, for Phase 3 (Istio ingress + JWT
#              authn) verification - logging in as a real customer_a/
#              customer_b user is how a JWT with the right tenant_id claim
#              gets minted. Does NOT use user-service's own
#              POST /api/v1/users (that route needs an admin JWT already -
#              chicken-and-egg for the very first user).
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<ip>:5432/itsm?sslmode=disable \
#   SEED_PASSWORD='<dev password>' \
#     bash scripts/seed-customer-user.sh
#
#   USERS="owner@customer-a.example:customer_a owner@customer-b.example:customer_b owner@customer-c.example:customer_c" \
#   DATABASE_URL=... SEED_PASSWORD=... bash scripts/seed-customer-user.sh
#
# Required env vars:
#   DATABASE_URL   - full Postgres connection string
#   SEED_PASSWORD  - plaintext password to hash and set for every seeded user
#
# Optional env vars:
#   USERS - space-separated "email:tenant_slug" pairs
#           (default: "owner@customer-a.example:customer_a owner@customer-b.example:customer_b")

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable SEED_PASSWORD=... bash scripts/seed-customer-user.sh" >&2
  exit 1
fi
if [[ -z "${SEED_PASSWORD:-}" ]]; then
  echo "ERROR: SEED_PASSWORD is not set." >&2
  exit 1
fi

USERS="${USERS:-owner@customer-a.example:customer_a owner@customer-b.example:customer_b}"

# gen_hash <password> -> a bcrypt cost-12 hash, matching user-service's
# bcryptCost = 12 (platform-app/services/user-service/internal/handlers/users.go).
gen_hash() {
  local pw="$1"
  if command -v htpasswd &>/dev/null; then
    htpasswd -bnBC 12 "" "$pw" | cut -d: -f2
  elif python3 -c 'import bcrypt' &>/dev/null 2>&1; then
    python3 -c 'import bcrypt,sys; print(bcrypt.hashpw(sys.argv[1].encode(), bcrypt.gensalt(12)).decode())' "$pw"
  elif command -v docker &>/dev/null; then
    docker run --rm httpd:2.4 htpasswd -bnBC 12 "" "$pw" | cut -d: -f2
  else
    echo "ERROR: no bcrypt hash generator found. Install one of: apache2-utils (htpasswd), python3 + the bcrypt package, or docker." >&2
    exit 1
  fi
}

echo "==> seed-customer-user.sh"

HASH="$(gen_hash "${SEED_PASSWORD}")"
if [[ -z "${HASH}" || "${HASH}" != '$2'* ]]; then
  echo "ERROR: generated hash doesn't look like a bcrypt hash (expected to start with '\$2'): '${HASH}'" >&2
  exit 1
fi

EMAILS_SQL=""
for pair in ${USERS}; do
  email="${pair%%:*}"
  slug="${pair##*:}"
  name="Owner (${slug})"
  echo "    seeding ${email}  (tenant_id=${slug})"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "
    INSERT INTO public.users (email, password_hash, full_name, role, tenant_id, is_active)
    VALUES ('${email}', '${HASH}', '${name}', 'admin', '${slug}', true)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          tenant_id = EXCLUDED.tenant_id,
          is_active = true;
  " > /dev/null
  EMAILS_SQL="${EMAILS_SQL:+${EMAILS_SQL},}'${email}'"
done

echo "==> Seeded users:"
psql "${DATABASE_URL}" -c "SELECT email, role, tenant_id, is_active FROM public.users WHERE email IN (${EMAILS_SQL}) ORDER BY tenant_id;"

echo "==> Done."

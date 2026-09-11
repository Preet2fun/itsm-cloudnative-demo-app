#!/usr/bin/env bash
# Script: tenant-isolation-smoke-test.sh
# Description: Proves customer-app enforces per-tenant data isolation THROUGH
#              THE MESH - a request authenticated as customer_a (a real JWT,
#              minted via user-service's login+MFA flow) can never read
#              customer_b's restaurants/orders/deliveries/payments, whether by
#              list or by direct id, and a client-supplied X-Tenant-ID header
#              cannot override the JWT's tenant_id claim. Also checks the mesh
#              rejects missing/invalid tokens. Read-only, safe to re-run.
#              Supersedes the Phase 2 version (raw X-Tenant-ID via
#              port-forward), which 403s once Phase 3's deny-unauthenticated
#              policy is live. Re-verifies #35 as part of Phase 3 (#49).
#
# Usage:
#   SEED_PASSWORD='<dev password>' bash scripts/tenant-isolation-smoke-test.sh
#
# Required env vars:
#   SEED_PASSWORD - password for the users seed-customer-user.sh created
#
# Optional env vars:
#   NODE_IP       - a cluster node's reachable IP (default: first node's InternalIP via kubectl)
#   GATEWAY_HOST  - VirtualService host                (default: customer-app.dev.local)
#   GATEWAY_PORT  - IngressGateway NodePort             (default: 30080)
#   USER_A        - customer_a login email              (default: owner@customer-a.example)
#   USER_B        - customer_b login email              (default: owner@customer-b.example)
#
# Exit status: 0 if every assertion passed, 1 otherwise.

set -euo pipefail

: "${SEED_PASSWORD:?ERROR: SEED_PASSWORD is not set (password for the seeded users)}"

GATEWAY_HOST="${GATEWAY_HOST:-customer-app.dev.local}"
GATEWAY_PORT="${GATEWAY_PORT:-30080}"
USER_A="${USER_A:-owner@customer-a.example}"
USER_B="${USER_B:-owner@customer-b.example}"

if [[ -z "${NODE_IP:-}" ]]; then
  NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
fi
[[ -n "${NODE_IP}" ]] || { echo "ERROR: could not determine NODE_IP; set it explicitly." >&2; exit 1; }

BASE="http://${GATEWAY_HOST}:${GATEWAY_PORT}"
RESOLVE_OPT="${GATEWAY_HOST}:${GATEWAY_PORT}:${NODE_IP}"

PASS=0
FAIL=0

# ── HTTP + JSON helpers ──────────────────────────────────────────────────────

# req <url> [extra curl args...]  ->  sets HTTP_CODE and HTTP_BODY
req() {
  local url="$1"; shift
  local tmp; tmp="$(mktemp)"
  HTTP_CODE="$(curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -w '%{http_code}' "$@" "$url")"
  HTTP_BODY="$(cat "$tmp")"
  rm -f "$tmp"
}

j_total()  { python3 -c 'import sys,json; print(json.load(sys.stdin).get("total",""))'; }
j_len()    { python3 -c 'import sys,json; print(len(json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_ids()    { python3 -c 'import sys,json; print(" ".join(x["id"] for x in json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_obj_id() { python3 -c 'import sys,json; print(json.load(sys.stdin)[sys.argv[1]][0]["id"])' "$1"; }
j_arr_id() { python3 -c 'import sys,json; a=json.load(sys.stdin); print(a[0]["id"] if a else "")'; }
j_arr_len(){ python3 -c 'import sys,json; print(len(json.load(sys.stdin)))'; }

check() {
  local desc="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  PASS  %s  (%s)\n' "$desc" "$actual"; PASS=$((PASS+1))
  else
    printf '  FAIL  %s  — expected [%s], got [%s]\n' "$desc" "$expected" "$actual"; FAIL=$((FAIL+1))
  fi
}

check_absent() {
  local desc="$1" needle="$2" hay="$3"
  if [[ " $hay " == *" $needle "* ]]; then
    printf '  FAIL  %s  — id %s leaked into results\n' "$desc" "$needle"; FAIL=$((FAIL+1))
  else
    printf '  PASS  %s\n' "$desc"; PASS=$((PASS+1))
  fi
}

# ── Login (dev MFA-code-via-logs; see user-service internal/handlers/auth.go) ─

# login <email> <password>  ->  echoes a JWT on stdout
login() {
  local email="$1" password="$2" tmp session_id code="" token attempt

  tmp="$(mktemp)"
  curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -X POST "${BASE}/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}"
  session_id="$(python3 -c 'import sys,json; print(json.load(sys.stdin)["session_id"])' < "$tmp")"

  curl -s --resolve "${RESOLVE_OPT}" -o /dev/null -X POST "${BASE}/api/v1/auth/mfa/send" \
    -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"${session_id}\"}"

  for attempt in 1 2 3 4 5; do
    sleep 1
    code="$(kubectl logs -n itsm-dev deploy/user-service --since=60s 2>/dev/null \
      | grep 'dev-mode: MFA OTP' \
      | grep "\"email\":\"${email}\"" \
      | tail -1 \
      | python3 -c 'import sys,json; l=sys.stdin.readline(); print(json.loads(l)["code"]) if l.strip() else print("")' 2>/dev/null || true)"
    [[ -n "${code}" ]] && break
  done
  [[ -n "${code}" ]] || { echo "ERROR: could not find an MFA code for ${email} in user-service logs (checked last 60s, 5 attempts)" >&2; exit 1; }

  curl -s --resolve "${RESOLVE_OPT}" -o "$tmp" -X POST "${BASE}/api/v1/auth/mfa/verify" \
    -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"${session_id}\",\"code\":\"${code}\"}"
  token="$(python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])' < "$tmp")"
  rm -f "$tmp"
  [[ -n "${token}" && "${token}" != "None" ]] || { echo "ERROR: mfa/verify did not return a token for ${email}" >&2; exit 1; }
  echo "${token}"
}

echo "==> Logging in as ${USER_A} and ${USER_B}"
JWT_A="$(login "${USER_A}" "${SEED_PASSWORD}")"
JWT_B="$(login "${USER_B}" "${SEED_PASSWORD}")"
echo "    got JWT_A (${#JWT_A} chars), JWT_B (${#JWT_B} chars)"
echo

# ── Phase 0 — mesh auth itself ──────────────────────────────────────────────
echo "==> Phase 0 — mesh rejects missing/invalid tokens"

req "${BASE}/api/v1/restaurants"
check "no token -> 403" "$HTTP_CODE" "403"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer not-a-real-jwt"
check "garbage token -> 401" "$HTTP_CODE" "401"

echo
# ── Phase A — positive control: B sees its own data ─────────────────────────
echo "==> Phase A — customer_b sees its own data (proves the rows exist)"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_B}"
check "B restaurants list -> 200" "$HTTP_CODE" "200"
check "B restaurant count"        "$(printf '%s' "$HTTP_BODY" | j_total)" "1"
B_REST_ID="$(printf '%s' "$HTTP_BODY" | j_obj_id restaurants)"

req "${BASE}/api/v1/orders" -H "Authorization: Bearer ${JWT_B}"
check "B orders list -> 200" "$HTTP_CODE" "200"
check "B order count"        "$(printf '%s' "$HTTP_BODY" | j_len orders)" "2"
B_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
B_ORDER_ID="${B_ORDER_IDS%% *}"

B_DELIV_ID=""; B_DELIV_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${BASE}/api/v1/deliveries?orderId=${oid}" -H "Authorization: Bearer ${JWT_B}"
  did="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$did" ]]; then B_DELIV_ID="$did"; B_DELIV_ORDER="$oid"; break; fi
done
[[ -n "$B_DELIV_ID" ]] || { echo "ERROR: no delivery under any customer_b order — seed data problem" >&2; exit 1; }

B_PAY_ID=""; B_PAY_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${BASE}/api/v1/payments?orderId=${oid}" -H "Authorization: Bearer ${JWT_B}"
  pid="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$pid" ]]; then B_PAY_ID="$pid"; B_PAY_ORDER="$oid"; break; fi
done
[[ -n "$B_PAY_ID" ]] || { echo "ERROR: no payment under any customer_b order — seed data problem" >&2; exit 1; }

req "${BASE}/api/v1/restaurants/${B_REST_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own restaurant by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/orders/${B_ORDER_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own order by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/deliveries/${B_DELIV_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own delivery by id -> 200" "$HTTP_CODE" "200"
req "${BASE}/api/v1/payments/${B_PAY_ID}" -H "Authorization: Bearer ${JWT_B}"
check "B GET own payment by id -> 200" "$HTTP_CODE" "200"

echo
# ── Phase B — isolation: A must not see B's data ────────────────────────────
echo "==> Phase B — customer_a must NOT see customer_b's data"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_A}"
check        "A restaurant list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_total)" "2"
check_absent "A restaurant list excludes B's restaurant" "$B_REST_ID" "$(printf '%s' "$HTTP_BODY" | j_ids restaurants)"

req "${BASE}/api/v1/orders" -H "Authorization: Bearer ${JWT_A}"
check "A order list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_len orders)" "4"
A_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
for bid in $B_ORDER_IDS; do
  check_absent "A order list excludes B order ${bid:0:8}…" "$bid" "$A_ORDER_IDS"
done

req "${BASE}/api/v1/restaurants/${B_REST_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's restaurant by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/orders/${B_ORDER_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's order by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/deliveries/${B_DELIV_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's delivery by id -> 404" "$HTTP_CODE" "404"
req "${BASE}/api/v1/payments/${B_PAY_ID}" -H "Authorization: Bearer ${JWT_A}"
check "A GET B's payment by id -> 404" "$HTTP_CODE" "404"

req "${BASE}/api/v1/deliveries?orderId=${B_DELIV_ORDER}" -H "Authorization: Bearer ${JWT_A}"
check "A list deliveries for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list deliveries for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"
req "${BASE}/api/v1/payments?orderId=${B_PAY_ORDER}" -H "Authorization: Bearer ${JWT_A}"
check "A list payments for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list payments for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"

echo
# ── Phase C — a client-supplied X-Tenant-ID cannot override the JWT claim ───
echo "==> Phase C — header-spoof defense"

req "${BASE}/api/v1/restaurants" -H "Authorization: Bearer ${JWT_A}" -H "X-Tenant-ID: customer_b"
check "A + spoofed X-Tenant-ID:customer_b -> still 200" "$HTTP_CODE" "200"
check "A + spoofed X-Tenant-ID:customer_b -> still A's count (2)" "$(printf '%s' "$HTTP_BODY" | j_total)" "2"

echo
echo "==> ${PASS} passed, ${FAIL} failed"
(( FAIL == 0 )) || exit 1
echo "==> Tenant isolation holds through the mesh."

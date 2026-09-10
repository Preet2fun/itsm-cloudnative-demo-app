#!/usr/bin/env bash
# Script: tenant-isolation-smoke-test.sh
# Description: Proves customer-app enforces per-tenant data isolation — a
#              request tagged `X-Tenant-ID: customer_a` can never read
#              customer_b's restaurants, orders, deliveries or payments,
#              whether by list endpoint or by direct resource id. All calls
#              are GETs, so the script is read-only and safe to re-run.
#              Closes GitHub #35 (customer-app Phase 2).
#
# Usage:
#   bash scripts/tenant-isolation-smoke-test.sh
#     Self-manages `kubectl port-forward` for all 4 services in $NAMESPACE
#     (needs kubectl + a working context).
#
#   ORDER_URL=http://host CATALOG_URL=http://host \
#   DELIVERY_URL=http://host PAYMENT_URL=http://host \
#     bash scripts/tenant-isolation-smoke-test.sh
#     Skips port-forward and hits the given base URLs instead — e.g. through
#     the Istio ingress once Phase 3 lands, or from inside the cluster.
#     All four must be set together, or none.
#
# Optional env vars:
#   NAMESPACE  — k8s namespace              (default: customer-app-dev)
#   TENANT_A   — the calling tenant         (default: customer_a)
#   TENANT_B   — tenant whose data must stay hidden from A (default: customer_b)
#   TENANT_C   — third tenant, list-count spot check       (default: customer_c)
#
# Exit status: 0 if every assertion passed, 1 otherwise.

set -euo pipefail

NAMESPACE="${NAMESPACE:-customer-app-dev}"
TENANT_A="${TENANT_A:-customer_a}"
TENANT_B="${TENANT_B:-customer_b}"
TENANT_C="${TENANT_C:-customer_c}"

PASS=0
FAIL=0
PF_PIDS=()

cleanup() {
  if (( ${#PF_PIDS[@]} )); then
    kill "${PF_PIDS[@]}" 2>/dev/null || true
    wait "${PF_PIDS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── HTTP + JSON helpers ──────────────────────────────────────────────────────

# req <url> <tenant>  →  sets HTTP_CODE and HTTP_BODY
req() {
  local url="$1" tenant="$2" tmp
  tmp="$(mktemp)"
  HTTP_CODE="$(curl -s -o "$tmp" -w '%{http_code}' -H "X-Tenant-ID: ${tenant}" "$url")"
  HTTP_BODY="$(cat "$tmp")"
  rm -f "$tmp"
}

j_total()  { python3 -c 'import sys,json; print(json.load(sys.stdin).get("total",""))'; }
j_len()    { python3 -c 'import sys,json; print(len(json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_ids()    { python3 -c 'import sys,json; print(" ".join(x["id"] for x in json.load(sys.stdin)[sys.argv[1]]))' "$1"; }
j_obj_id() { python3 -c 'import sys,json; print(json.load(sys.stdin)[sys.argv[1]][0]["id"])' "$1"; }
j_arr_id() { python3 -c 'import sys,json; a=json.load(sys.stdin); print(a[0]["id"] if a else "")'; }
j_arr_len(){ python3 -c 'import sys,json; print(len(json.load(sys.stdin)))'; }

# check "<description>" <actual> <expected>
check() {
  local desc="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  PASS  %s  (%s)\n' "$desc" "$actual"; PASS=$((PASS+1))
  else
    printf '  FAIL  %s  — expected [%s], got [%s]\n' "$desc" "$expected" "$actual"; FAIL=$((FAIL+1))
  fi
}

# check_absent "<description>" <needle-id> "<space-separated haystack>"
check_absent() {
  local desc="$1" needle="$2" hay="$3"
  if [[ " $hay " == *" $needle "* ]]; then
    printf '  FAIL  %s  — id %s leaked into results\n' "$desc" "$needle"; FAIL=$((FAIL+1))
  else
    printf '  PASS  %s\n' "$desc"; PASS=$((PASS+1))
  fi
}

wait_ready() {
  local url="$1" name="$2" i
  for i in $(seq 1 30); do
    if curl -sf -o /dev/null "${url}/api/v1/health"; then return 0; fi
    sleep 1
  done
  echo "ERROR: ${name} not reachable at ${url}/api/v1/health after 30s" >&2
  exit 1
}

# ── Resolve service base URLs ────────────────────────────────────────────────

ORDER_URL="${ORDER_URL:-}"
CATALOG_URL="${CATALOG_URL:-}"
DELIVERY_URL="${DELIVERY_URL:-}"
PAYMENT_URL="${PAYMENT_URL:-}"

overrides=0
for v in "$ORDER_URL" "$CATALOG_URL" "$DELIVERY_URL" "$PAYMENT_URL"; do
  [[ -n "$v" ]] && overrides=$((overrides+1))
done
if (( overrides > 0 && overrides < 4 )); then
  echo "ERROR: set all four of ORDER_URL/CATALOG_URL/DELIVERY_URL/PAYMENT_URL, or none." >&2
  exit 1
fi

if (( overrides == 0 )); then
  command -v kubectl >/dev/null || { echo "ERROR: kubectl not found and no *_URL overrides set." >&2; exit 1; }
  echo "==> Port-forwarding customer-app services in namespace '${NAMESPACE}' (svc port 80)"
  kubectl port-forward -n "$NAMESPACE" svc/order-service    18081:80 >/dev/null 2>&1 & PF_PIDS+=($!)
  kubectl port-forward -n "$NAMESPACE" svc/catalog-service  18082:80 >/dev/null 2>&1 & PF_PIDS+=($!)
  kubectl port-forward -n "$NAMESPACE" svc/delivery-service 18083:80 >/dev/null 2>&1 & PF_PIDS+=($!)
  kubectl port-forward -n "$NAMESPACE" svc/payment-service  18084:80 >/dev/null 2>&1 & PF_PIDS+=($!)
  ORDER_URL="http://127.0.0.1:18081"
  CATALOG_URL="http://127.0.0.1:18082"
  DELIVERY_URL="http://127.0.0.1:18083"
  PAYMENT_URL="http://127.0.0.1:18084"
fi

wait_ready "$ORDER_URL"    order-service
wait_ready "$CATALOG_URL"  catalog-service
wait_ready "$DELIVERY_URL" delivery-service
wait_ready "$PAYMENT_URL"  payment-service

echo "==> tenant-isolation-smoke-test  (A='${TENANT_A}' trying to reach B='${TENANT_B}')"
echo

# ── Phase A — positive control: B can see its own data ───────────────────────
echo "==> Phase A — ${TENANT_B} sees its own data (proves the rows exist)"

req "${CATALOG_URL}/api/v1/restaurants" "$TENANT_B"
check "B restaurants list -> 200" "$HTTP_CODE" "200"
check "B restaurant count"        "$(printf '%s' "$HTTP_BODY" | j_total)" "1"
B_REST_ID="$(printf '%s' "$HTTP_BODY" | j_obj_id restaurants)"

req "${ORDER_URL}/api/v1/orders" "$TENANT_B"
check "B orders list -> 200" "$HTTP_CODE" "200"
check "B order count"        "$(printf '%s' "$HTTP_BODY" | j_len orders)" "2"
B_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
B_ORDER_ID="${B_ORDER_IDS%% *}"

B_DELIV_ID=""; B_DELIV_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${DELIVERY_URL}/api/v1/deliveries?orderId=${oid}" "$TENANT_B"
  did="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$did" ]]; then B_DELIV_ID="$did"; B_DELIV_ORDER="$oid"; break; fi
done
[[ -n "$B_DELIV_ID" ]] || { echo "ERROR: no delivery under any ${TENANT_B} order — seed data problem" >&2; exit 1; }

B_PAY_ID=""; B_PAY_ORDER=""
for oid in $B_ORDER_IDS; do
  req "${PAYMENT_URL}/api/v1/payments?orderId=${oid}" "$TENANT_B"
  pid="$(printf '%s' "$HTTP_BODY" | j_arr_id)"
  if [[ -n "$pid" ]]; then B_PAY_ID="$pid"; B_PAY_ORDER="$oid"; break; fi
done
[[ -n "$B_PAY_ID" ]] || { echo "ERROR: no payment under any ${TENANT_B} order — seed data problem" >&2; exit 1; }

req "${CATALOG_URL}/api/v1/restaurants/${B_REST_ID}" "$TENANT_B"
check "B GET own restaurant by id -> 200" "$HTTP_CODE" "200"
req "${ORDER_URL}/api/v1/orders/${B_ORDER_ID}" "$TENANT_B"
check "B GET own order by id -> 200" "$HTTP_CODE" "200"
req "${DELIVERY_URL}/api/v1/deliveries/${B_DELIV_ID}" "$TENANT_B"
check "B GET own delivery by id -> 200" "$HTTP_CODE" "200"
req "${PAYMENT_URL}/api/v1/payments/${B_PAY_ID}" "$TENANT_B"
check "B GET own payment by id -> 200" "$HTTP_CODE" "200"

echo
# ── Phase B — isolation: A must not see any of B's data ──────────────────────
echo "==> Phase B — ${TENANT_A} must NOT see ${TENANT_B}'s data"

req "${CATALOG_URL}/api/v1/restaurants" "$TENANT_A"
check        "A restaurant list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_total)" "2"
check_absent "A restaurant list excludes B's restaurant" "$B_REST_ID" "$(printf '%s' "$HTTP_BODY" | j_ids restaurants)"

req "${ORDER_URL}/api/v1/orders" "$TENANT_A"
check "A order list is A's own count" "$(printf '%s' "$HTTP_BODY" | j_len orders)" "4"
A_ORDER_IDS="$(printf '%s' "$HTTP_BODY" | j_ids orders)"
for bid in $B_ORDER_IDS; do
  check_absent "A order list excludes B order ${bid:0:8}…" "$bid" "$A_ORDER_IDS"
done

req "${CATALOG_URL}/api/v1/restaurants/${B_REST_ID}" "$TENANT_A"
check "A GET B's restaurant by id -> 404" "$HTTP_CODE" "404"
req "${ORDER_URL}/api/v1/orders/${B_ORDER_ID}" "$TENANT_A"
check "A GET B's order by id -> 404" "$HTTP_CODE" "404"
req "${DELIVERY_URL}/api/v1/deliveries/${B_DELIV_ID}" "$TENANT_A"
check "A GET B's delivery by id -> 404" "$HTTP_CODE" "404"
req "${PAYMENT_URL}/api/v1/payments/${B_PAY_ID}" "$TENANT_A"
check "A GET B's payment by id -> 404" "$HTTP_CODE" "404"

req "${DELIVERY_URL}/api/v1/deliveries?orderId=${B_DELIV_ORDER}" "$TENANT_A"
check "A list deliveries for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list deliveries for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"
req "${PAYMENT_URL}/api/v1/payments?orderId=${B_PAY_ORDER}" "$TENANT_A"
check "A list payments for B's order -> HTTP 200" "$HTTP_CODE" "200"
check "A list payments for B's order -> empty"    "$(printf '%s' "$HTTP_BODY" | j_arr_len)" "0"

echo
# ── Phase C — bonus: third tenant sees only its own ─────────────────────────
echo "==> Phase C — ${TENANT_C} list-count spot check"
req "${CATALOG_URL}/api/v1/restaurants" "$TENANT_C"
check "C restaurant count" "$(printf '%s' "$HTTP_BODY" | j_total)" "1"

echo
echo "==> ${PASS} passed, ${FAIL} failed"
(( FAIL == 0 )) || exit 1
echo "==> Tenant isolation holds."
